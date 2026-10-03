import webpush from "web-push";
import {
  deleteSubscriptionById,
  getSubscriptionsForEntry,
} from "@/lib/notifications/subscription";
import type {
  CustomerNotificationInput,
  PushNotificationPayload,
} from "@/lib/notifications/types";

/**
 * Web Push service.
 *
 * Owns VAPID configuration, payload construction and delivery. The only
 * entry point for the rest of the app is `notifyCustomer()` — routes and
 * the queue mutation layer never talk to `web-push` directly and never
 * build payloads themselves, which keeps future notification types (and
 * their copy) in one place.
 *
 * VAPID_PRIVATE_KEY is read here on the server only and must never be
 * imported from client code.
 */

let configured = false;
let warnedMissingConfig = false;

/**
 * Applies VAPID details once, lazily, so the app boots (and `next build`
 * completes) even when the keys are not set. Returns false when push is
 * unconfigured — callers then no-op instead of crashing the request.
 */
function ensureConfigured(): boolean {
  if (configured) {
    return true;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "Web Push is not configured: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT (see .env.example).",
      );
    }

    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (error) {
    // A malformed subject (missing mailto:/https:) or key must not take
    // the queue operation down — report once and treat push as off.
    console.error("Failed to configure VAPID details:", error);
    warnedMissingConfig = true;

    return false;
  }

  return configured;
}

/** The public VAPID key, served to the browser so it can subscribe. */
export function getVapidPublicKey(): string | null {
  return ensureConfigured() ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;
}

/**
 * Builds the wire payload for a notification.
 *
 * Switches on `type` so every kind's copy lives here rather than in the
 * queue mutation layer, which only decides *when* a notification is due.
 * Contains only display copy and a same-origin URL — no customer names,
 * no identifiers beyond the token the customer already sees on screen.
 */
function buildPayload(input: CustomerNotificationInput): PushNotificationPayload {
  switch (input.type) {
    case "TOKEN_CALLED": {
      const where = input.businessName ? ` at ${input.businessName}` : "";

      return {
        title: "Qzen — It's Your Turn",
        body: `Your token #${input.tokenNumber} is now being served${where}.`,
        url: input.url,
        tag: `qzen-token-called-${input.queueEntryId}`,
      };
    }

    case "ALMOST_YOUR_TURN": {
      const body =
        input.peopleAhead === 1
          ? `Your token #${input.tokenNumber} is almost up. There is 1 customer ahead of you.`
          : `Your token #${input.tokenNumber} is approaching. There are ${input.peopleAhead} customers ahead of you.`;

      return {
        title: "Qzen — Almost Your Turn",
        body,
        url: input.url,
        tag: `qzen-almost-your-turn-${input.queueEntryId}`,
      };
    }

    case "QUEUE_PAUSED": {
      const where = input.businessName ? ` at ${input.businessName}` : "";

      return {
        title: "Qzen — Queue Paused",
        body: `The queue${where} is currently paused. We'll let you know when it resumes.`,
        url: input.url,
        tag: `qzen-queue-paused-${input.queueEntryId}`,
      };
    }

    case "QUEUE_RESUMED": {
      const where = input.businessName ? ` at ${input.businessName}` : "";

      return {
        title: "Qzen — Queue Resumed",
        body: `The queue${where} has resumed. Your place in line is still active.`,
        url: input.url,
        tag: `qzen-queue-resumed-${input.queueEntryId}`,
      };
    }

    case "QUEUE_CLOSED": {
      const where = input.businessName ? ` at ${input.businessName}` : "";

      return {
        title: "Qzen — Queue Closed",
        body: `The queue${where} has been closed.`,
        url: input.url,
        tag: `qzen-queue-closed-${input.queueEntryId}`,
      };
    }

    // No `default`: the switch is exhaustive over `CustomerNotificationType`,
    // so TypeScript fails the build ("Function lacks ending return statement")
    // the moment a new type is added here without a payload template.
  }
}

/**
 * Delivers one payload to one subscription.
 *
 * Classifies failures: 404/410 mean the push service has dropped the
 * subscription, so the record is dead and must be deleted rather than
 * retried; every other failure (network, VAPID, 5xx) is transient or
 * server-side and leaves the record alone.
 */
async function sendToSubscription(
  subscription: { _id: unknown; endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushNotificationPayload,
): Promise<"sent" | "invalid" | "failed"> {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      JSON.stringify(payload),
      // A "your turn" alert is worthless a day late, and should reach the
      // OS promptly while the customer is still on the premises.
      { TTL: 60 * 60 * 12, urgency: "high" },
    );

    return "sent";
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return "invalid";
    }

    // Never log the endpoint or keys — status and message only.
    console.error(
      `Push delivery failed (status ${statusCode ?? "unknown"}):`,
      error instanceof Error ? error.message : error,
    );

    return "failed";
  }
}

/**
 * Sends a notification to every device subscribed for a queue entry.
 *
 * Safe to call fire-and-forget: it never throws, logs rather than fails
 * when push is unconfigured, and removes subscriptions the push service
 * reports as expired (404/410) so they are not retried.
 */
export async function notifyCustomer(
  input: CustomerNotificationInput,
): Promise<void> {
  try {
    if (!ensureConfigured()) {
      return;
    }

    const subscriptions = await getSubscriptionsForEntry(input.queueEntryId);

    if (subscriptions.length === 0) {
      return;
    }

    const payload = buildPayload(input);

    const results = await Promise.all(
      subscriptions.map(async (subscription) => ({
        subscription,
        result: await sendToSubscription(subscription, payload),
      })),
    );

    for (const { subscription, result } of results) {
      if (result === "invalid") {
        await deleteSubscriptionById(subscription._id);
      }
    }
  } catch (error) {
    // Notifications are an additive channel: a failure here must never
    // affect the queue operation that triggered it.
    console.error("notifyCustomer failed:", error);
  }
}
