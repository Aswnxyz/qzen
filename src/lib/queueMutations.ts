import { getBusinessByOwner, getQueueForOwner } from "@/lib/authorization";
import { getIO } from "@/lib/socket";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import {
  buildCustomerUrl,
  notifyAlmostTurnCustomers,
  notifyWaitingCustomers,
} from "@/lib/notifications/dispatch";
import { notifyCustomer } from "@/lib/notifications/push";
import {
  removeSubscriptionsForEntry,
  removeSubscriptionsForQueue,
} from "@/lib/notifications/subscription";
import type { QueueStateNotificationType } from "@/lib/notifications/types";
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
 * Maps a real queue status transition onto the notification it produces —
 * `null` means nothing worth announcing happened.
 *
 * Only the three transitions a customer can observe are announced: an
 * active queue that pauses, a paused queue that resumes, and a queue that
 * closes. Writing the status a queue already has (the dashboard re-sends
 * the current one) yields `null` before these rules are even considered,
 * and reopening a closed queue deliberately yields `null` too, so a
 * repeated PATCH can never re-alert the same waiting customers.
 */
function queueStateNotificationType(
  from: string,
  to: string,
): QueueStateNotificationType | null {
  if (from === to) {
    return null;
  }

  if (from === "active" && to === "paused") {
    return "QUEUE_PAUSED";
  }

  if (from === "paused" && to === "active") {
    return "QUEUE_RESUMED";
  }

  if (to === "closed" && (from === "active" || from === "paused")) {
    return "QUEUE_CLOSED";
  }

  return null;
}

/**
 * Moves a queue from `from` to `to` with a single conditional update, and
 * reports whether *this* call performed the move.
 *
 * The filter only matches while the document still holds `from`, so of
 * several requests that raced after reading the same previous status,
 * exactly one wins. That is what makes a duplicated request — a
 * double-clicked pause, a dashboard retry, a delete racing a status
 * change — write what it was asked to write but announce the transition
 * once: the losers stay silent, because the request whose write matched
 * is the one that reports it.
 */
async function claimStatusTransition(
  queueId: string,
  from: string,
  to: string,
  extra: Record<string, unknown> = {},
) {
  return Queue.findOneAndUpdate(
    { _id: queueId, status: from },
    { $set: { status: to, ...extra } },
    { new: true },
  );
}

/**
 * Decides which of several concurrent `callNextCustomer` requests really
 * gets to serve a customer, and hands the entry back when it does not.
 *
 * The promotion of the lowest waiting entry is already a single atomic
 * update, but "nobody is being served yet" is a property of the whole
 * session rather than of that one document. So two requests that both read
 * past the sequential guard can each promote somebody: the slower one only
 * becomes eligible once the faster one has already left `waiting`.
 *
 * The turn is therefore claimed the same way `claimStatusTransition` claims a
 * status change — a conditional update whose filter encodes the state that
 * must still hold, with a null result meaning "lost the race". The caller
 * holding the front of the queue keeps its entry (the lowest token, `_id`
 * breaking a tie, so the order is total and exactly one caller can win);
 * every other caller restores its own entry to `waiting` while it is still
 * `serving` and reports the same error the sequential guard uses.
 *
 * Returns true when `entry` really owns the turn.
 */
async function claimServingTurn(
  queueId: string,
  sessionId: string,
  entry: { _id: mongoose.Types.ObjectId; tokenNumber: number },
): Promise<boolean> {
  const ahead = await QueueEntry.findOne({
    queueId,
    sessionId,
    status: "serving",
    _id: { $ne: entry._id },
    $or: [
      { tokenNumber: { $lt: entry.tokenNumber } },
      { tokenNumber: entry.tokenNumber, _id: { $lt: entry._id } },
    ],
  })
    .select("_id")
    .lean();

  if (!ahead) {
    return true;
  }

  await QueueEntry.updateOne(
    { _id: entry._id, status: "serving" },
    { $set: { status: "waiting" }, $unset: { calledAt: 1 } },
  );

  return false;
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
 *
 * Customers still waiting are told the queue closed before their
 * subscriptions are dropped — see `queueStateNotificationType` for which
 * transitions produce a notification.
 */
export async function deleteQueueForOwner(ownerId: string, queueId: string) {
  const { business, queue } = await requireOwnedQueue(ownerId, queueId);

  // Captured before the write so a queue that was already closed does not
  // re-alert customers who were told about it the first time.
  const previousStatus = queue.status;

  // A soft-delete is also a real move into `closed`, so it is claimed
  // through the same atomic transition as `setQueueStatus`: of several
  // concurrent requests only one announces, and the delete marker lands
  // regardless — a delete always deletes.
  const claimed = await claimStatusTransition(queueId, previousStatus, "closed", {
    deletedAt: new Date(),
  });

  if (claimed) {
    queue.status = claimed.status;
    queue.deletedAt = claimed.deletedAt;
  } else {
    await Queue.updateOne(
      { _id: queueId },
      { $set: { status: "closed", deletedAt: new Date() } },
    );

    const latest = await Queue.findById(queueId);

    if (latest) {
      queue.status = latest.status;
      queue.deletedAt = latest.deletedAt;
    }
  }

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

  // Tell the customers still waiting that the queue is gone — but only
  // when this request is the one that actually closed it. Awaited (the
  // helper never throws) purely so the push is not raced by the
  // subscription cleanup below.
  const notificationType = claimed
    ? queueStateNotificationType(previousStatus, "closed")
    : null;

  if (notificationType) {
    const queueSession = await getOrCreateQueueSession(queueId);

    if (queueSession) {
      await notifyWaitingCustomers({
        type: notificationType,
        queueId,
        sessionId: queueSession._id.toString(),
        business,
        queue,
      });
    }
  }

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
 *
 * After the transition succeeds, the customers still `waiting` are told
 * about it (see `queueStateNotificationType`). Nothing is sent for a write
 * that leaves the status unchanged.
 */
export async function setQueueStatus(
  ownerId: string,
  queueId: string,
  status: string,
) {
  const { business, queue } = await requireOwnedQueue(ownerId, queueId);

  if (!getQueueStatuses().includes(status)) {
    throw new QueueOperationError("Invalid queue status");
  }

  // Captured before the write so a transition that really happened can be
  // told apart from a redundant re-send of the status the queue already had.
  const previousStatus = queue.status;

  const queueSession = await getOrCreateQueueSession(queueId);

  if (!queueSession) {
    throw new QueueOperationError("Failed to get today's queue session", 500);
  }

  queueSession.status = status;
  queueSession.closedAt = status === "closed" ? new Date() : undefined;

  await queueSession.save();

  // The status move itself is the claim (see `claimStatusTransition`): of
  // several requests that raced after reading the same previous status,
  // exactly one can match, so a double-clicked pause writes the value
  // twice but announces it once — and the losers report whatever the
  // winner actually stored.
  const claimed = await claimStatusTransition(queueId, previousStatus, status);

  if (claimed) {
    queue.status = claimed.status;
  } else {
    const latest = await Queue.findById(queueId);

    if (latest) {
      queue.status = latest.status;
    }
  }

  emitQueueUpdated(queueId, {
    status: queueSession.status,
    currentToken: queueSession.currentToken,
  });

  // Web Push only for the request that actually performed the transition,
  // and only if it is a transition worth announcing. Fire-and-forget:
  // `notifyWaitingCustomers` never throws and a delivery problem cannot
  // undo a status change that already succeeded.
  const notificationType = claimed
    ? queueStateNotificationType(previousStatus, status)
    : null;

  if (notificationType) {
    void notifyWaitingCustomers({
      type: notificationType,
      queueId,
      sessionId: queueSession._id.toString(),
      business,
      queue,
    });
  }

  return { queue, queueSession };
}

/**
 * Calls the next waiting customer.
 *
 * The selection rule (lowest `tokenNumber` among today's `waiting` entries),
 * the "already serving" guard, the closed-session guard and the session's
 * `currentToken` bookkeeping are exactly what `POST /call-next` does.
 *
 * Overlapping calls are settled by `claimServingTurn`, so exactly one of
 * them serves a customer and the rest report "already being served" — the
 * same outcome the guard above produces when calls do not overlap.
 *
 * A successful call also evaluates `ALMOST_YOUR_TURN` for the customers
 * left waiting, since a call is the only event that moves anyone's
 * position.
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

  // Of several requests that raced past the guard above, exactly one keeps
  // the customer — see `claimServingTurn`. A loser hands the entry straight
  // back and stops here, so it never books `currentToken`, never broadcasts
  // and never notifies anybody.
  const claimed = await claimServingTurn(
    queueId,
    queueSession._id.toString(),
    nextEntry,
  );

  if (!claimed) {
    throw new QueueOperationError("A customer is already being served");
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
    url: buildCustomerUrl({ business, queue }),
    businessName: business.name,
    queueName: queue.name,
  });

  // Calling a customer also shifted everyone else's position, which is the
  // only moment the almost-turn threshold changes. Skipped while paused —
  // there is no progression to announce — and deduplicated per ticket
  // inside the helper, so re-running it can never double-alert anyone.
  if (queueSession.status !== "paused") {
    void notifyAlmostTurnCustomers({
      queueId,
      sessionId: queueSession._id.toString(),
      business,
      queue,
    });
  }

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
