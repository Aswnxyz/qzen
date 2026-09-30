import type {
  AuthInfo,
  CallToolResult,
  McpServer,
} from "@modelcontextprotocol/server";
import mongoose from "mongoose";
import * as z from "zod/v4";

import { getBusinessByOwner, getQueueForOwner } from "@/lib/authorization";
import { getDateKey, getQueueSessionForDate } from "@/lib/queueSession";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";

/**
 * Every tool registered here is strictly read-only: they only ever run
 * `find`/`countDocuments` queries and never create or mutate sessions,
 * entries or queues.
 */
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const DEFAULT_TIMEZONE = "Asia/Kolkata";

type QueueRecord = {
  _id: unknown;
  name?: string;
  slug?: string;
  status?: string;
  currentToken?: number;
  averageServiceTime?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type SessionRecord = {
  _id: unknown;
  dateKey?: string;
  status?: string;
  currentToken?: number;
  startedAt?: unknown;
  closedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type EntryRecord = {
  _id: unknown;
  tokenNumber?: number;
  customerName?: string;
  status?: string;
  joinedAt?: unknown;
  calledAt?: unknown;
  completedAt?: unknown;
  skippedAt?: unknown;
};

/**
 * Failures that are safe to surface verbatim to the MCP client, such as bad
 * input or a queue the caller does not own.
 */
class ToolInputError extends Error {}

function toIsoDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date ? value : new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeQueue(queue: QueueRecord) {
  return {
    id: String(queue._id),
    name: queue.name ?? "",
    slug: queue.slug ?? "",
    status: queue.status ?? "active",
    currentToken: queue.currentToken ?? 0,
    averageServiceTime: queue.averageServiceTime ?? 0,
    createdAt: toIsoDate(queue.createdAt),
    updatedAt: toIsoDate(queue.updatedAt),
  };
}

function serializeSession(session: SessionRecord) {
  return {
    id: String(session._id),
    dateKey: session.dateKey ?? "",
    status: session.status ?? "active",
    currentToken: session.currentToken ?? 0,
    startedAt: toIsoDate(session.startedAt),
    closedAt: toIsoDate(session.closedAt),
    createdAt: toIsoDate(session.createdAt),
    updatedAt: toIsoDate(session.updatedAt),
  };
}

function serializeEntry(entry: EntryRecord) {
  return {
    id: String(entry._id),
    tokenNumber: entry.tokenNumber ?? 0,
    customerName: entry.customerName ?? "",
    status: entry.status ?? "waiting",
    joinedAt: toIsoDate(entry.joinedAt),
    calledAt: toIsoDate(entry.calledAt),
    completedAt: toIsoDate(entry.completedAt),
    skippedAt: toIsoDate(entry.skippedAt),
  };
}

function toolResult(payload: Record<string, unknown>): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

function toolError(message: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: false,
            error: message,
          },
          null,
          2,
        ),
      },
    ],
    structuredContent: {
      success: false,
      error: message,
    },
    isError: true,
  };
}

function handleToolError(error: unknown): CallToolResult {
  if (error instanceof ToolInputError) {
    return toolError(error.message);
  }

  console.error("MCP tool error:", error);

  return toolError("Failed to read queue data.");
}

/**
 * Reads the Qzen user id from the verified access token claims.
 *
 * `sub` is set to the better-auth user id for tokens issued to a user, which is
 * the same value `getSession()` exposes as `session.user.id`.
 */
function getAuthenticatedUserId(authInfo?: AuthInfo): string | null {
  const subject = authInfo?.extra?.sub;

  if (
    typeof subject !== "string" ||
    !mongoose.Types.ObjectId.isValid(subject)
  ) {
    return null;
  }

  return subject;
}

/**
 * Resolves a queue only after proving it belongs to the authenticated owner.
 *
 * A queue id that does not exist and one owned by another business both report
 * the same error so callers cannot probe for ids they do not own.
 */
async function requireOwnedQueue(ownerId: string | null, queueId: string) {
  if (!ownerId) {
    throw new ToolInputError("Not authenticated.");
  }

  if (!mongoose.Types.ObjectId.isValid(queueId)) {
    throw new ToolInputError("Invalid queueId.");
  }

  const { business, queue } = await getQueueForOwner(ownerId, queueId);

  if (!business) {
    throw new ToolInputError("No business found for this account.");
  }

  if (!queue) {
    throw new ToolInputError("Queue not found.");
  }

  return { business, queue };
}

/**
 * Resolves today's session with the same timezone/date logic Qzen already uses.
 *
 * This only reads the session: unlike `getOrCreateQueueSession` it never
 * creates a session or closes stale ones.
 */
async function getTodayContext(
  business: { timezone?: string },
  queueId: string,
) {
  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const dateKey = getDateKey(timezone);
  const session = await getQueueSessionForDate(queueId, dateKey);

  return { timezone, dateKey, session };
}

export function registerQueueTools(server: McpServer, authInfo?: AuthInfo) {
  const ownerId = getAuthenticatedUserId(authInfo);

  server.registerTool(
    "list_queues",
    {
      title: "List queues",
      description:
        "Lists every queue that belongs to the authenticated business.",
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
}
