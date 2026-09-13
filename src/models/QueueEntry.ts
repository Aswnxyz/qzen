import mongoose, { Schema } from "mongoose";

const queueEntrySchema = new Schema(
  {
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "QueueSession",
    },

    tokenNumber: {
      type: Number,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["waiting", "serving", "completed", "skipped"],
      default: "waiting",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    calledAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
    skippedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

const QueueEntry =
  mongoose.models.QueueEntry || mongoose.model("QueueEntry", queueEntrySchema);

export default QueueEntry;
