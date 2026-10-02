import mongoose, { Schema } from "mongoose";

/**
 * A browser's Web Push subscription, scoped to the specific queue entry
 * (customer ticket) that asked for it.
 *
 * Deliberately separate from QueueEntry: push credentials are transport
 * details, not queue state, and a customer may hold subscriptions from
 * several devices for the same entry. No personal information is stored —
 * only the push service endpoint and its encryption keys.
 */
const pushSubscriptionSchema = new Schema(
  {
    queueEntryId: {
      type: Schema.Types.ObjectId,
      ref: "QueueEntry",
      required: true,
    },

    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },

    endpoint: {
      type: String,
      required: true,
      maxlength: 2048,
    },

    keys: {
      p256dh: {
        type: String,
        required: true,
        maxlength: 256,
      },
      auth: {
        type: String,
        required: true,
        maxlength: 256,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Fast lookup when a customer's token is called.
pushSubscriptionSchema.index({ queueEntryId: 1 });

// One record per browser subscription per queue entry: re-subscribing
// (page reload, re-enable) upserts instead of piling up duplicates.
pushSubscriptionSchema.index({ endpoint: 1, queueEntryId: 1 }, { unique: true });

// Queue-scoped cleanup (closed/soft-deleted queues).
pushSubscriptionSchema.index({ queueId: 1 });

// Safety-net TTL: entries live inside a daily queue session, so anything
// older than a week is certainly orphaned (process died before its cleanup
// hook ran, queue never used again). Catches accumulation the explicit
// hooks miss. Seven days is far beyond any legitimate session lifetime.
pushSubscriptionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 },
);

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
