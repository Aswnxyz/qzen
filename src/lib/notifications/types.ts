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
 * Fields every customer notification carries.
 *
 * `queueEntryId` selects whose subscriptions receive it, so one
 * notification always reaches exactly one ticket's devices; `url` is the
 * customer status page every notification opens. The names are display
 * copy only — nothing personal travels over the wire.
 */
interface CustomerNotificationContext {
  queueEntryId: string;
  queueId: string;
  /** Path to the customer status page, e.g. `/join/acme/salon-a`. */
  url: string;
  businessName?: string;
  queueName?: string;
}

/**
 * Input accepted by `notifyCustomer()`.
 *
 * A discriminated union: `type` selects the payload template and narrows
 * to exactly the domain facts that template needs. The server derives
 * every field from the QueueEntry / Queue it just transitioned — nothing
 * comes from the client, and callers never construct payloads directly.
 *
 * Adding a notification kind here is the whole extension mechanism: the
 * switch in `buildPayload()` is exhaustive, so TypeScript fails the build
 * until the new template exists.
 */
export type CustomerNotificationInput =
  | ({ type: "TOKEN_CALLED"; tokenNumber: number } & CustomerNotificationContext)
  | ({
      type: "ALMOST_YOUR_TURN";
      tokenNumber: number;
      /** How many tickets are still waiting ahead of this one (1 or 2). */
      peopleAhead: number;
    } & CustomerNotificationContext)
  | ({ type: "QUEUE_PAUSED" } & CustomerNotificationContext)
  | ({ type: "QUEUE_RESUMED" } & CustomerNotificationContext)
  | ({ type: "QUEUE_CLOSED" } & CustomerNotificationContext);

/** Every notification kind Qzen sends to a customer. */
export type CustomerNotificationType = CustomerNotificationInput["type"];

/**
 * The subset produced by a queue status transition.
 *
 * Derived rather than listed, so a future queue-state kind cannot be
 * omitted from the dispatch helper that fans it out to waiting customers.
 */
export type QueueStateNotificationType = Extract<
  CustomerNotificationType,
  `QUEUE_${string}`
>;
