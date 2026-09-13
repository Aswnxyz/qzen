import mongoose, { Schema } from "mongoose";

const queueSessionSchema = new Schema(
  {
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },

    dateKey: {
      type: String,
      required: true,
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

    startedAt: {
      type: Date,
      default: Date.now,
    },

    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

queueSessionSchema.index({ queueId: 1, dateKey: 1 }, { unique: true });

const QueueSession =
  mongoose.models.QueueSession ||
  mongoose.model("QueueSession", queueSessionSchema);

export default QueueSession;
