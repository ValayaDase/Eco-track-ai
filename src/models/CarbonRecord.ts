import mongoose, { Schema } from "mongoose";

const CarbonRecordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    transportEmission: {
      type: Number,
      default: 0,
    },
    electricityEmission: {
      type: Number,
      default: 0,
    },
    foodEmission: {
      type: Number,
      default: 0,
    },
    wasteEmission: {
      type: Number,
      default: 0,
    },
    shoppingEmission: {
      type: Number,
      default: 0,
    },
    totalEmission: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one carbon record per user per date
CarbonRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.CarbonRecord || mongoose.model("CarbonRecord", CarbonRecordSchema);
