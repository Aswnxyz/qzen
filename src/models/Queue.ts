import mongoose, { Schema } from "mongoose";

const queueSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },

    currentToken: {
      type: Number,
      default: 0,
    },

    // Soft-delete marker. `null` means the queue is live; a date means the
    // owner deleted it. The document, its sessions and its entries are all
    // kept, so history and analytics survive — queries that must only see live
    // queues filter with `deletedAt: null` (which also matches documents
    // written before this field existed).
    deletedAt: {
      type: Date,
      default: null,
    },

    averageServiceTime: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

const Queue =
  mongoose.models.Queue ||
  mongoose.model("Queue", queueSchema);

export default Queue;