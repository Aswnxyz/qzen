import type { AuthInfo, CallToolResult } from "@modelcontextprotocol/server";
import mongoose from "mongoose";

import { getQueueForOwner } from "@/lib/authorization";
import { QueueOperationError } from "@/lib/queueMutations";
import { getDateKey, getQueueSessionForDate } from "@/lib/queueSession";

/**
 * Shared primitives behind every Qzen MCP tool.
 *
 * Stage 1 read tools, Stage 2 write tools and Stage 3 analytics tools all build
 * on these so the same condition always produces the same message, the same
 * envelope and the same `isError` shape, no matter which tool reported it.
 */

/**
 * Read tools only ever run `find`/`countDocuments` queries and never create or
 * mutate sessions, entries or queues.
 */
export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * A mutation that adds or advances state without destroying anything, and
 * whose result depends on when it runs — calling it twice is never the same as
 * calling it once. Used by `create_queue` and `call_next_customer`.
 */
export const MUTATION_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

/**
 * A reversible status change: applying the same status twice leaves the queue
 * in the same state, so the call is idempotent and non-destructive.
 */
export const STATUS_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * A terminal transition. Completing or skipping closes out the customer that
 * is being served for good, so `destructiveHint` is accurate here rather than
 * the default.
 */
export const TERMINAL_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const;

/**
 * The write scope checked per tool. `requireMcpAuth` already requires
 * `mcp:read` for every request to this route; `mcp:write` is checked inside
 * each write tool so a read-only token can list them but never invoke them.
 */
const MCP_WRITE_SCOPE = "mcp:write";

/** Fallback used whenever a business has no explicit timezone. */
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export type QueueRecord = {
  _id: unknown;
  name?: string;
  slug?: string;
  status?: string;
  currentToken?: number;
  averageServiceTime?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SessionRecord = {
  _id: unknown;
  dateKey?: string;
  status?: string;
  currentToken?: number;
  startedAt?: unknown;
  closedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type EntryRecord = {
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
export class ToolInputError extends Error {}

export function toIsoDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date ? value : new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function serializeQueue(queue: QueueRecord) {
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

export function serializeSession(session: SessionRecord) {
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

export function serializeEntry(entry: EntryRecord) {
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

export function toolResult(payload: Record<string, unknown>): CallToolResult {
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

export function toolError(message: string): CallToolResult {
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

export function handleToolError(
  error: unknown,
  fallbackMessage = "Failed to read queue data.",
): CallToolResult {
  if (error instanceof ToolInputError) {
    return toolError(error.message);
  }

  // `QueueOperationError` carries a message Qzen already returns from its HTTP
  // API for the same condition, so it is safe to show the caller as-is.
  if (error instanceof QueueOperationError) {
    return toolError(error.message);
  }

  console.error("MCP tool error:", error);

  return toolError(fallbackMessage);
}

export function getScopes(authInfo?: AuthInfo) {
  return Array.isArray(authInfo?.scopes) ? authInfo.scopes : [];
}

/**
 * Rejects a tool call made with a token that lacks `mcp:write`.
 *
 * Runs before any database work, so a read-scoped token cannot even resolve the
 * queue it points at.
 */
export function requireWriteScope(scopes: string[]) {
  if (!scopes.includes(MCP_WRITE_SCOPE)) {
    throw new ToolInputError(
      `Insufficient scope: this tool requires the ${MCP_WRITE_SCOPE} scope.`,
    );
  }
}

/**
 * Reads the Qzen user id from the verified access token claims.
 *
 * `sub` is set to the better-auth user id for tokens issued to a user, which is
 * the same value `getSession()` exposes as `session.user.id`.
 */
export function getAuthenticatedUserId(authInfo?: AuthInfo): string | null {
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
export async function requireOwnedQueue(
  ownerId: string | null,
  queueId: string,
) {
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
export async function getTodayContext(
  business: { timezone?: string },
  queueId: string,
) {
  const timezone = business.timezone || DEFAULT_TIMEZONE;
  const dateKey = getDateKey(timezone);
  const session = await getQueueSessionForDate(queueId, dateKey);

  return { timezone, dateKey, session };
}
