import QueueEntry from "@/models/QueueEntry";
import { notifyCustomer } from "@/lib/notifications/push";
import type { QueueStateNotificationType } from "@/lib/notifications/types";

/**
 * Notification dispatch.
 *
 * Answers *which customers* should be told and *when* a notification is
 * due — the queue mutation layer decides which of these to run, and
 * `notifyCustomer()` still owns how a payload is delivered (Web Push,
 * VAPID, stale-endpoint cleanup).
 *
 * Two kinds of targeting live here:
 *
 * - queue-state fan-out: every entry still `waiting` in the current
 *   session, so serving/completed/skipped tickets are structurally
 *   excluded and previous days' customers are unreachable.
 * - ALMOST_YOUR_TURN: waiting entries within the position threshold,
 *   each claiming an atomic marker first so a ticket is alerted once.
 *
 * Everything here swallows its own errors: a notification problem can
 * never fail the queue operation that triggered it.
 */

/** Alert a waiting customer when at most this many tickets are ahead. */
const ALMOST_TURN_MAX_AHEAD = 2;

/**
 * The queue/business facts every notification needs: the customer URL and
 * the display copy both derive from them, so callers never format either.
 */
export interface QueueNotificationContext {
  business: { name: string; slug: string };
  queue: { name: string; slug: string };
}

/**
 * The one customer URL format, shared by every notification kind so a
 * push can never open a differently-shaped link than the ticket does.
 */
export function buildCustomerUrl(context: QueueNotificationContext): string {
  return `/join/${context.business.slug}/${context.queue.slug}`;
}

/** Scopes every recipient query to one queue's current session. */
interface SessionScope {
  queueId: string;
  sessionId: string;
}

/**
 * The current session's waiting tickets, closest to being called first.
 *
 * The ordering is what makes position arithmetic possible: index in this
 * list equals the number of *still waiting* tickets with a lower token
 * number. Token numbers themselves are never subtracted, because gaps are
 * normal once customers are skipped or completed.
 */
function waitingQuery(scope: SessionScope) {
  return QueueEntry.find({
    queueId: scope.queueId,
    sessionId: scope.sessionId,
    status: "waiting",
  }).sort({ tokenNumber: 1 });
}

/**
 * Notifies everyone who is `waiting` right now about a queue state change.
 *
 * `type` says which transition happened; the caller has already established
 * that it really occurred. Entries with no subscription are skipped by
 * `notifyCustomer`, which also deletes endpoints the push service reports
 * as gone (404/410).
 */
export async function notifyWaitingCustomers(
  input: SessionScope &
    QueueNotificationContext & { type: QueueStateNotificationType },
): Promise<void> {
  try {
    const url = buildCustomerUrl(input);
    const entries = await waitingQuery(input).select("_id").lean();

    await Promise.all(
      entries.map((entry) =>
        notifyCustomer({
          type: input.type,
          queueEntryId: String(entry._id),
          queueId: input.queueId,
          url,
          businessName: input.business.name,
          queueName: input.queue.name,
        }),
      ),
    );
  } catch (error) {
    console.error(`notifyWaitingCustomers(${input.type}) failed:`, error);
  }
}

/**
 * Alerts waiting customers who are within `ALMOST_TURN_MAX_AHEAD` people
 * of the front of the queue — and never the same ticket twice.
 *
 * Called after the queue advances, because that is the only event that
 * changes anybody's position. The zero-ahead customer is deliberately left
 * out: they are next, so `TOKEN_CALLED` is the message that matters.
 */
export async function notifyAlmostTurnCustomers(
  input: SessionScope & QueueNotificationContext,
): Promise<void> {
  try {
    const url = buildCustomerUrl(input);

    // Only the first ALMOST_TURN_MAX_AHEAD + 1 waiting tickets can be
    // within the threshold, so one bounded query covers every candidate.
    const candidates = await waitingQuery(input)
      .limit(ALMOST_TURN_MAX_AHEAD + 1)
      .select("_id tokenNumber")
      .lean();

    await Promise.all(
      candidates.map(async (entry, peopleAhead) => {
        if (peopleAhead === 0 || peopleAhead > ALMOST_TURN_MAX_AHEAD) {
          return;
        }

        const entryId = String(entry._id);

        // Claim before sending: only the caller that flips the marker
        // sends. The guard also re-checks `status: "waiting"`, so a ticket
        // that completed or was skipped in the meantime is left alone, and
        // concurrent queue advances can never double-alert a customer.
        const claimed = await QueueEntry.findOneAndUpdate(
          {
            _id: entryId,
            status: "waiting",
            almostTurnNotifiedAt: { $exists: false },
          },
          { $set: { almostTurnNotifiedAt: new Date() } },
        );

        if (!claimed) {
          return;
        }

        await notifyCustomer({
          type: "ALMOST_YOUR_TURN",
          queueEntryId: entryId,
          queueId: input.queueId,
          tokenNumber: entry.tokenNumber,
          peopleAhead,
          url,
          businessName: input.business.name,
          queueName: input.queue.name,
        });
      }),
    );
  } catch (error) {
    console.error("notifyAlmostTurnCustomers failed:", error);
  }
}
