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