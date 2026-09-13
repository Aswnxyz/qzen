import mongoose, { Schema } from "mongoose";

const businessSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  { timestamps: true },
);

const Business =
  mongoose.models.Business || mongoose.model("Business", businessSchema);

export default Business;
