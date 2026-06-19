import mongoose, { Schema } from "mongoose";

const ReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    week: {
      type: String, // Format: YYYY-Wxx, optional if monthly
      default: null,
    },
    month: {
      type: String, // Format: YYYY-MM, optional if weekly
      default: null,
    },
    summary: {
      type: String,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
