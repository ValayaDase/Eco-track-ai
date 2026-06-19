import mongoose, { Schema } from "mongoose";

const ActivitySchema = new Schema(
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
    walkingDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    cyclingDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    bikeDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    carDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    busDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    trainDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    electricityUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    acHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    foodType: {
      type: String,
      default: "vegan",
      enum: ["vegan", "vegetarian", "pescatarian", "meat-heavy"],
    },
    plasticUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    shoppingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedChallenges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one activity record per date
ActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
