/**
 * Shared types for the browser push notification subsystem.
 *
 * The payload shapes here are what travels over the wire to the service
 * worker (`public/sw.js`) and what the subscription API accepts. Keeping
 * them in one place lets the push service, the API routes and the client
 * opt-in UI agree on a single contract.
 */

/**
 * The raw browser PushSubscription as reported by the Push API, i.e. what
 * `PushManager.subscribe()` returns and what the client POSTs to Qzen.
 * Only `endpoint` and `keys` are persisted — `expirationTime` is advisory.
 */
export interface BrowserPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * What the service worker receives as the push payload and renders as a
 * system notification. Deliberately contains nothing personal: a token
 * number, display copy, and the customer status page URL to open on click.
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  /** Same-origin URL opened (or focused) when the notification is clicked. */
  url: string;
  /** Collapses repeats of the same logical notification at OS level. */
  tag?: string;
}

/**
 * Notification kinds Qzen may send. Phase 1 ships only `TOKEN_CALLED`;
 * the union is the extension point for future types (almost your turn,
 * queue paused/resumed/closed) without changing the notify API.
 */
export type CustomerNotificationType = "TOKEN_CALLED";

/**
 * Input accepted by `notifyCustomer()`.
 *
 * `type` selects the payload template; the remaining fields are the
 * minimal domain facts needed to build it. The server derives everything
 * from the QueueEntry it just transitioned — nothing here comes from the
 * client, and callers never construct payloads directly.
 */
export type CustomerNotificationInput = {
  type: CustomerNotificationType;
  queueEntryId: string;
  queueId: string;
} & TokenCalledDetails;

interface TokenCalledDetails {
  tokenNumber: number;
  /** Path to the customer status page, e.g. `/join/acme/salon-a`. */
  url: string;
  businessName?: string;
  queueName?: string;
}
