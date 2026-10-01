import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { getBusinessByOwner } from "@/lib/authorization";
import {
  DEFAULT_TIMEZONE,
  MUTATION_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
  STATUS_ANNOTATIONS,
  TERMINAL_ANNOTATIONS,
  ToolInputError,
  getAuthenticatedUserId,
  getScopes,
  getTodayContext,
  handleToolError,
  requireOwnedQueue,
  requireWriteScope,
  serializeEntry,
  serializeQueue,
  serializeSession,
  toolResult,
} from "@/lib/mcpShared";
import {
  callNextCustomer,
  completeCurrentCustomer,
  createQueueForOwner,
  deleteQueueForOwner,
  getQueueStatuses,
  setQueueStatus,
  skipCurrentCustomer,
  updateQueueForOwner,
} from "@/lib/queueMutations";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";

export function registerQueueTools(server: McpServer, authInfo?: AuthInfo) {
  const ownerId = getAuthenticatedUserId(authInfo);
  const writeScopes = getScopes(authInfo);
  const queueStatusValues = getQueueStatuses();

  const statusDescription =
    queueStatusValues.length > 0
      ? `New status for the queue. Allowed values: ${queueStatusValues.join(", ")}.`
      : "New status for the queue.";

  server.registerTool(
    "list_queues",
    {
      title: "List queues",
      description:
        "Lists every queue that belongs to the authenticated business, excluding queues that have been deleted.",
      inputSchema: z.object({}),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      try {
        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const business = await getBusinessByOwner(ownerId);

        if (!business) {
          throw new ToolInputError("No business found for this account.");
        }

        const queues = await Queue.find({
          businessId: business._id,
          deletedAt: null,
        })
          .sort({ createdAt: 1 })
          .lean();

        return toolResult({
          success: true,
          business: {
            id: String(business._id),
            name: business.name,
            slug: business.slug,
            timezone: business.timezone || DEFAULT_TIMEZONE,
          },
          count: queues.length,
          queues: queues.map((queue) => serializeQueue(queue)),
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  server.registerTool(
    "get_queue_status",
    {
      title: "Get queue status",
      description:
        "Returns a queue and today's session status. Read-only: a missing session is reported, never created.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to inspect."),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        const { business, queue } = await requireOwnedQueue(ownerId, queueId);
        const { timezone, dateKey, session } = await getTodayContext(
          business,
          String(queue._id),
        );

        let waitingCount = 0;
        let nowServing: Record<string, unknown> | null = null;

        if (session) {
          const [waiting, serving] = await Promise.all([
            QueueEntry.countDocuments({
              queueId: queue._id,
              sessionId: session._id,
              status: "waiting",
            }),
            QueueEntry.findOne({
              queueId: queue._id,
              sessionId: session._id,
              status: "serving",
            }).lean(),
          ]);

          waitingCount = waiting;
          nowServing = serving
            ? {
                tokenNumber: serving.tokenNumber,
                customerName: serving.customerName,
              }
            : null;
        }

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
          timezone,
          dateKey,
          exists: Boolean(session),
          session: session ? serializeSession(session) : null,
          waitingCount,
          nowServing,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  server.registerTool(
    "get_waiting_customers",
    {
      title: "Get waiting customers",
      description:
        "Lists today's waiting customers for a queue in queue order (lowest token first). Read-only.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to inspect."),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        const { business, queue } = await requireOwnedQueue(ownerId, queueId);
        const { timezone, dateKey, session } = await getTodayContext(
          business,
          String(queue._id),
        );

        const customers = session
          ? await QueueEntry.find({
              queueId: queue._id,
              sessionId: session._id,
              status: "waiting",
            })
              .sort({ tokenNumber: 1 })
              .lean()
          : [];

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
          timezone,
          dateKey,
          session: session ? serializeSession(session) : null,
          count: customers.length,
          customers: customers.map((customer) => serializeEntry(customer)),
          ...(session
            ? {}
            : { message: "No session exists for today's date yet." }),
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  server.registerTool(
    "get_queue_session",
    {
      title: "Get queue session",
      description:
        "Returns today's session for a queue when one exists. Read-only: a missing session is reported, never created.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to inspect."),
      }),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        const { business, queue } = await requireOwnedQueue(ownerId, queueId);
        const { timezone, dateKey, session } = await getTodayContext(
          business,
          String(queue._id),
        );

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
          timezone,
          dateKey,
          exists: Boolean(session),
          session: session ? serializeSession(session) : null,
          ...(session
            ? {}
            : {
                message:
                  "No session exists for today's date yet. It was not created.",
              }),
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  /**
   * Write tools.
   *
   * `ownerId` always comes from the verified access-token claims, and every
   * operation below re-checks it inside `queueMutations` before touching the
   * database. Nothing the client sends is ever treated as identity or
   * authority, and a queue owned by another business reports exactly the same
   * error as one that does not exist.
   */
  server.registerTool(
    "create_queue",
    {
      title: "Create queue",
      description:
        "Creates a queue under the authenticated user's own business. Requires the mcp:write scope. The business is resolved from the verified identity, so no businessId is ever accepted from the caller.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Display name for the new queue."),
        slug: z
          .string()
          .min(1)
          .describe("URL slug for the queue, for example morning-desk."),
      }),
      annotations: MUTATION_ANNOTATIONS,
    },
    async ({ name, slug }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue } = await createQueueForOwner(ownerId, { name, slug });

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
        });
      } catch (error) {
        return handleToolError(error, "Failed to create queue");
      }
    },
  );

  server.registerTool(
    "update_queue",
    {
      title: "Update queue",
      description:
        "Renames a queue on the authenticated user's own business. Requires the mcp:write scope. The name is the only field that can be updated: the queue slug is never accepted as input because it is the public join URL and QR code target.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to rename."),
        name: z.string().min(1).describe("New display name for the queue."),
      }),
      annotations: STATUS_ANNOTATIONS,
    },
    async ({ queueId, name }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue } = await updateQueueForOwner(ownerId, queueId, {
          name,
        });

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
        });
      } catch (error) {
        return handleToolError(error, "Failed to update queue");
      }
    },
  );

  server.registerTool(
    "update_queue_status",
    {
      title: "Update queue status",
      description:
        "Sets the status of an owned queue and mirrors it onto today's session. Requires the mcp:write scope.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to update."),
        status: z.string().describe(statusDescription),
      }),
      annotations: STATUS_ANNOTATIONS,
    },
    async ({ queueId, status }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue, queueSession } = await setQueueStatus(
          ownerId,
          queueId,
          status,
        );

        return toolResult({
          success: true,
          queue: serializeQueue(queue),
          session: serializeSession(queueSession),
        });
      } catch (error) {
        return handleToolError(error, "Failed to update queue status");
      }
    },
  );

  server.registerTool(
    "call_next_customer",
    {
      title: "Call next customer",
      description:
        "Calls the lowest-token waiting customer on an owned queue and makes them the one being served. Requires the mcp:write scope.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to advance."),
      }),
      annotations: MUTATION_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue, queueSession, entry, message } = await callNextCustomer(
          ownerId,
          queueId,
        );

        return toolResult({
          success: true,
          message,
          queue: serializeQueue(queue),
          session: serializeSession(queueSession),
          entry: serializeEntry(entry),
        });
      } catch (error) {
        return handleToolError(error, "Failed to call next customer");
      }
    },
  );

  server.registerTool(
    "complete_current_customer",
    {
      title: "Complete current customer",
      description:
        "Completes the customer that is currently being served on an owned queue, and only that customer. Requires the mcp:write scope.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue."),
      }),
      annotations: TERMINAL_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue, queueSession, entry, message } =
          await completeCurrentCustomer(ownerId, queueId);

        return toolResult({
          success: true,
          message,
          queue: serializeQueue(queue),
          session: serializeSession(queueSession),
          entry: serializeEntry(entry),
        });
      } catch (error) {
        return handleToolError(error, "Failed to complete customer");
      }
    },
  );

  server.registerTool(
    "skip_current_customer",
    {
      title: "Skip current customer",
      description:
        "Skips the customer that is currently being served on an owned queue, and only that customer. Requires the mcp:write scope.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue."),
      }),
      annotations: TERMINAL_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue, queueSession, entry, message } = await skipCurrentCustomer(
          ownerId,
          queueId,
        );

        return toolResult({
          success: true,
          message,
          queue: serializeQueue(queue),
          session: serializeSession(queueSession),
          entry: serializeEntry(entry),
        });
      } catch (error) {
        return handleToolError(error, "Failed to skip customer");
      }
    },
  );

  /**
   * Soft delete, mirroring the dashboard's Delete queue action: the queue stops
   * being a live queue and can no longer be read or joined, while its sessions,
   * customer entries and all history stay in the database.
   */
  server.registerTool(
    "delete_queue",
    {
      title: "Delete queue",
      description:
        "Deletes a queue on the authenticated user's own business. Requires the mcp:write scope. The queue stops being a live queue: it leaves the queue lists and can no longer be joined, while its sessions, customer entries and history are kept.",
      inputSchema: z.object({
        queueId: z.string().describe("The id of the queue to delete."),
      }),
      annotations: TERMINAL_ANNOTATIONS,
    },
    async ({ queueId }) => {
      try {
        requireWriteScope(writeScopes);

        if (!ownerId) {
          throw new ToolInputError("Not authenticated.");
        }

        const { queue } = await deleteQueueForOwner(ownerId, queueId);

        return toolResult({
          success: true,
          message: "Queue deleted. Its history was kept.",
          queue: serializeQueue(queue),
        });
      } catch (error) {
        return handleToolError(error, "Failed to delete queue");
      }
    },
  );
}
