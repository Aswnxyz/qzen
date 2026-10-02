import { getBusinessByOwner, getQueueForOwner } from "@/lib/authorization";
import { getIO } from "@/lib/socket";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import { notifyCustomer } from "@/lib/notifications/push";
import {
  removeSubscriptionsForEntry,
  removeSubscriptionsForQueue,
} from "@/lib/notifications/subscription";
import mongoose from "mongoose";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import QueueSession from "@/models/QueueSession";

/**
 * An expected Qzen business-rule failure.
 *
 * `message` is always a message Qzen already returns from its HTTP API for the
 * same condition, so it is safe to surface verbatim to API clients and MCP
 * callers. `statusCode` mirrors the HTTP status the matching route uses.
 *
 * Anything that is *not* a `QueueOperationError` is unexpected and must be
 * logged server-side and replaced with a generic message.
 */
export class QueueOperationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "QueueOperationError";
    this.statusCode = statusCode;
  }
}

/**
 * Statuses the Queue model accepts, read from the schema definition itself so
 * callers can never drift from what the database layer will actually store.
 */
export function getQueueStatuses(): string[] {
  const raw = Queue.schema.path("status")?.options.enum;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((value): value is string => typeof value === "string");
}

/**
 * Resolves `queueId` only when it belongs to the business owned by `ownerId`.
 *
 * Every mutation in this module starts here, as does every analytics query in
 * `queueAnalytics.ts`, so a queue id on its own is never enough to read or
 * touch a queue. The errors mirror the read tools exactly: a queue owned by
 * another business reports the same thing as one that does not exist.
 */
export async function requireOwnedQueue(ownerId: string, queueId: string) {
  if (!mongoose.Types.ObjectId.isValid(queueId)) {
    throw new QueueOperationError("Invalid queueId.");
  }

  const { business, queue } = await getQueueForOwner(ownerId, queueId);

  if (!business) {
    throw new QueueOperationError("No business found for this account.");
  }

  if (!queue) {
    throw new QueueOperationError("Queue not found.", 404);
  }

  return { business, queue };
}

/**
 * Broadcasts the same `queueUpdated` event the HTTP routes emit, so dashboards
 * watching a queue stay in sync when a mutation came from MCP. `getIO()`
 * returns undefined when socket.io is not running, which makes this a no-op.
 */
function emitQueueUpdated(queueId: string, payload: Record<string, unknown>) {
  getIO()?.to(`queue:${queueId}`).emit("queueUpdated", payload);
}

/**
 * Creates a queue under the business owned by `ownerId`.
 *
 * The business is always resolved from the owner — the caller never supplies a
 * `businessId`. Validation and ordering match `POST /api/queues`.
 */
export async function createQueueForOwner(
  ownerId: string,
  input: { name?: unknown; slug?: unknown },
) {
  if (!input.name || !input.slug) {
    throw new QueueOperationError("Name and slug are required");
  }

  const business = await getBusinessByOwner(ownerId);

  if (!business) {
    throw new QueueOperationError("Business not found", 404);
  }

  const queue = await Queue.create({
    businessId: business._id,
    name: input.name,
    slug: input.slug,
  });

  return { business, queue };
}

/**
 * Renames a queue for the owner.
 *
 * The queue is resolved through `requireOwnedQueue`, so the caller can only
 * rename a queue that already belongs to their business. `name` is the only
 * accepted field: the slug is the public join URL (`/join/{businessSlug}/
 * {queueSlug}`) and the target of the QR code, so it is never changed by this
 * operation — a `slug` sent in the request body is deliberately not read.
 */
export async function updateQueueForOwner(
  ownerId: string,
  queueId: string,
  input: { name?: unknown },
) {
  const { queue } = await requireOwnedQueue(ownerId, queueId);

  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!name) {
    throw new QueueOperationError("Queue name is required");
  }

  queue.name = name;
  await queue.save();

  emitQueueUpdated(queueId, { name: queue.name, slug: queue.slug });

  return { queue };
}

/**
 * Soft-deletes a queue for the owner: it stops being a live queue, but nothing
 * is removed from the database.
 *
 * `deletedAt` marks the queue as deleted and `status` moves to `closed` using
 * the existing status architecture, which is what drops the queue out of the
 * live queue lists and stops it being joinable. Any session that is still
 * active or paused is closed the same way `setQueueStatus` closes one;
 * sessions that have already ended, every customer entry, and all history and
 * analytics data are left untouched.
 *
 * Ownership is proven by `requireOwnedQueue` before anything is written, so a
 * queue id from another business behaves exactly like one that does not exist.
 */
export async function deleteQueueForOwner(ownerId: string, queueId: string) {
  const { queue } = await requireOwnedQueue(ownerId, queueId);

  queue.status = "closed";
  queue.deletedAt = new Date();
  await queue.save();

  await QueueSession.updateMany(
    {
      queueId,
      status: { $in: ["active", "paused"] },
    },
    {
      $set: {
        status: "closed",
        closedAt: new Date(),
      },
    },
  );

  emitQueueUpdated(queueId, { status: "closed" });

  // The queue can never be joined or called from again: its subscriptions
  // are dead weight regardless of their entries' states.
  void removeSubscriptionsForQueue(queueId);

  return { queue };
}

/**
 * Sets the queue's status and mirrors it onto today's session.
 *
 * The allowed values come from the Queue model, and the session rules —
 * including `closedAt` bookkeeping and the `queueUpdated` broadcast — are the
 * ones `PATCH /api/queues/[queueId]/status` already applies. `getOrCreateQueueSession`
 * is reused as-is, so sessions are never duplicated.
 */
export async function setQueueStatus(
  ownerId: string,
  queueId: string,
  status: string,
) {
  const { queue } = await requireOwnedQueue(ownerId, queueId);

  if (!getQueueStatuses().includes(status)) {
    throw new QueueOperationError("Invalid queue status");
  }

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    throw new QueueOperationError("Failed to get today's queue session", 500);
  }

  queueSession.status = status;
  queueSession.closedAt = status === "closed" ? new Date() : undefined;

  await queueSession.save();

  queue.status = status;
  await queue.save();

  emitQueueUpdated(queueId, {
    status: queueSession.status,
    currentToken: queueSession.currentToken,
  });

  return { queue, queueSession };
}

/**
 * Calls the next waiting customer.
 *
 * The selection rule (lowest `tokenNumber` among today's `waiting` entries),
 * the "already serving" guard, the closed-session guard and the session's
 * `currentToken` bookkeeping are exactly what `POST /call-next` does.
 */
export async function callNextCustomer(ownerId: string, queueId: string) {
  const { business, queue } = await requireOwnedQueue(ownerId, queueId);

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    throw new QueueOperationError("Failed to get today's queue session", 500);
  }

  if (queueSession.status === "closed") {
    throw new QueueOperationError("This queue is closed");
  }

  const currentEntry = await QueueEntry.findOne({
    queueId,
    sessionId: queueSession._id,
    status: "serving",
  });

  if (currentEntry) {
    throw new QueueOperationError("A customer is already being served");
  }

  const nextEntry = await QueueEntry.findOneAndUpdate(
    {
      queueId,
      sessionId: queueSession._id,
      status: "waiting",
    },
    {
      status: "serving",
      calledAt: new Date(),
    },
    {
      sort: { tokenNumber: 1 },
      new: true,
    },
  );

  if (!nextEntry) {
    throw new QueueOperationError("No customers waiting");
  }

  queueSession.currentToken = nextEntry.tokenNumber;
  await queueSession.save();

  emitQueueUpdated(queueId, { currentToken: queueSession.currentToken });

  // Browser push: fire-and-forget, after the atomic waiting → serving
  // transition that only one concurrent caller can win, so a doubled
  // request can never produce a second notification.
  void notifyCustomer({
    type: "TOKEN_CALLED",
    queueEntryId: nextEntry._id.toString(),
    queueId,
    tokenNumber: nextEntry.tokenNumber,
    url: `/join/${business.slug}/${queue.slug}`,
    businessName: business.name,
    queueName: queue.name,
  });

  return {
    queue,
    queueSession,
    entry: nextEntry,
    message: `Token #${nextEntry.tokenNumber} is now being served`,
  };
}

/**
 * Completes the customer that is currently being served, and only that one.
 */
export async function completeCurrentCustomer(
  ownerId: string,
  queueId: string,
) {
  const { queue } = await requireOwnedQueue(ownerId, queueId);

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    throw new QueueOperationError("Failed to get today's queue session", 500);
  }

  const currentEntry = await QueueEntry.findOneAndUpdate(
    {
      queueId,
      sessionId: queueSession._id,
      status: "serving",
    },
    {
      status: "completed",
      completedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!currentEntry) {
    throw new QueueOperationError("No customer is currently being served");
  }

  // Terminal state: this ticket can never be called again.
  void removeSubscriptionsForEntry(currentEntry._id.toString());

  emitQueueUpdated(queueId, { currentToken: currentEntry.tokenNumber });

  return {
    queue,
    queueSession,
    entry: currentEntry,
    message: `Token #${currentEntry.tokenNumber} completed`,
  };
}

/**
 * Skips the customer that is currently being served, and only that one.
 */
export async function skipCurrentCustomer(ownerId: string, queueId: string) {
  const { queue } = await requireOwnedQueue(ownerId, queueId);

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    throw new QueueOperationError("Failed to get today's queue session", 500);
  }

  const currentEntry = await QueueEntry.findOneAndUpdate(
    {
      queueId,
      sessionId: queueSession._id,
      status: "serving",
    },
    {
      status: "skipped",
      skippedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!currentEntry) {
    throw new QueueOperationError("No customer is currently being served");
  }

  // Terminal state: this ticket can never be called again.
  void removeSubscriptionsForEntry(currentEntry._id.toString());

  emitQueueUpdated(queueId, { currentToken: currentEntry.tokenNumber });

  return {
    queue,
    queueSession,
    entry: currentEntry,
    message: `Token #${currentEntry.tokenNumber} skipped`,
  };
}
