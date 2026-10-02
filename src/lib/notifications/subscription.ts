import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import QueueEntry from "@/models/QueueEntry";
import type { BrowserPushSubscription } from "@/lib/notifications/types";

/**
 * Subscription storage service.
 *
 * Owns every read/write of the PushSubscription collection: validation,
 * upserts keyed on (endpoint, queueEntryId), explicit removal, and the
 * cleanup of subscriptions whose entry can no longer be called. Nothing
 * else in the app writes this collection directly.
 */

/**
 * Validates the browser payload before it touches the database.
 *
 * Checks the shapes Web Push requires: an https endpoint (the push
 * service URL) and both encryption keys as non-empty base64url strings.
 * Returns a normalized copy so callers never store extra fields a client
 * might send along.
 */
export function parseBrowserSubscription(
  input: unknown,
): BrowserPushSubscription | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }

  const { endpoint, keys } = input as Record<string, unknown>;

  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return null;
  }

  if (endpoint.length > 2048) {
    return null;
  }

  if (typeof keys !== "object" || keys === null) {
    return null;
  }

  const { p256dh, auth } = keys as Record<string, unknown>;

  if (!isBase64UrlString(p256dh) || !isBase64UrlString(auth)) {
    return null;
  }

  return {
    endpoint,
    keys: { p256dh, auth },
  };
}

/**
 * Web Push keys are base64url (RFC 7515): A–Z, a–z, 0–9, `-`, `_`, optional
 * trailing `=` padding, and never long enough to be suspicious.
 */
function isBase64UrlString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    /^[A-Za-z0-9_-]+={0,2}$/.test(value)
  );
}

/**
 * Stores (or refreshes) a subscription for a queue entry.
 *
 * Keyed on `endpoint + queueEntryId`, so the same browser re-subscribing —
 * a page reload, an "enable" pressed twice, a refreshed endpoint — updates
 * the existing record instead of creating duplicates, while a second
 * device for the same entry gets its own record.
 */
export async function upsertSubscription(input: {
  queueEntryId: string;
  queueId: string;
  subscription: BrowserPushSubscription;
}) {
  await connectDB();

  await PushSubscription.updateOne(
    {
      endpoint: input.subscription.endpoint,
      queueEntryId: input.queueEntryId,
    },
    {
      $set: {
        queueId: input.queueId,
        keys: input.subscription.keys,
      },
      $setOnInsert: {
        queueEntryId: input.queueEntryId,
        endpoint: input.subscription.endpoint,
      },
    },
    { upsert: true },
  );
}

/**
 * Removes one subscription when a customer turns notifications off.
 *
 * Scoped by endpoint so a caller can only delete the exact browser
 * subscription it presents — never someone else's record — and idempotent
 * so an unsubscribe that races with cleanup still reports success.
 */
export async function removeSubscription(input: {
  queueEntryId: string;
  endpoint: string;
}) {
  await connectDB();

  await PushSubscription.deleteOne({
    queueEntryId: input.queueEntryId,
    endpoint: input.endpoint,
  });
}

/**
 * Drops every subscription for a queue entry once that entry reaches a
 * terminal state (completed/skipped): it can never be called again, so
 * the records are dead weight. Callers fire this without awaiting.
 */
export async function removeSubscriptionsForEntry(queueEntryId: string) {
  await connectDB();

  await PushSubscription.deleteMany({ queueEntryId });
}

/**
 * Drops every subscription belonging to a queue when the queue itself is
 * soft-deleted and can never be joined or called from again.
 */
export async function removeSubscriptionsForQueue(queueId: string) {
  await connectDB();

  await PushSubscription.deleteMany({ queueId });
}

/** Loads every device subscription registered for a queue entry. */
export async function getSubscriptionsForEntry(queueEntryId: string) {
  await connectDB();

  return PushSubscription.find({ queueEntryId }).lean();
}

/**
 * Drops a single record once the push service has declared it dead
 * (HTTP 404/410), so an expired endpoint is never retried.
 */
export async function deleteSubscriptionById(id: unknown) {
  await connectDB();

  await PushSubscription.deleteOne({ _id: id });
}

/**
 * Opportunistic housekeeping: deletes this queue's subscriptions whose
 * entry is no longer live — a previous day's session, or an entry that
 * was completed or skipped without its cleanup hook running.
 *
 * Called whenever a customer subscribes, which is exactly when a fresh
 * batch of subscriptions exists to contrast against, so stale records
 * never accumulate no matter how the process exited last time.
 */
export async function pruneStaleSubscriptions(input: {
  queueId: string;
  sessionId: string;
}) {
  await connectDB();

  const subscriptions = await PushSubscription.find({ queueId: input.queueId })
    .select("queueEntryId")
    .lean();

  if (subscriptions.length === 0) {
    return;
  }

  const entryIds = [
    ...new Set(subscriptions.map((subscription) => subscription.queueEntryId)),
  ];

  const liveEntries = await QueueEntry.find({
    _id: { $in: entryIds },
    sessionId: input.sessionId,
    status: { $in: ["waiting", "serving"] },
  })
    .select("_id")
    .lean();

  const liveIds = new Set(liveEntries.map((entry) => String(entry._id)));
  const staleIds = entryIds.filter((id) => !liveIds.has(String(id)));

  if (staleIds.length > 0) {
    await PushSubscription.deleteMany({ queueEntryId: { $in: staleIds } });
  }
}
