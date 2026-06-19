import mongoose, { Schema } from "mongoose";

const ChallengeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Challenge || mongoose.model("Challenge", ChallengeSchema);
