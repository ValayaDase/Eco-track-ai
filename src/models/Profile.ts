import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    occupation: {
      type: String,
      required: true,
      trim: true,
    },
    familySize: {
      type: Number,
      required: true,
      min: 1,
    },
    dietType: {
      type: String,
      required: true,
      enum: ["vegan", "vegetarian", "pescatarian", "meat-heavy"],
    },
    transportMode: {
      type: String,
      required: true,
      enum: ["walking", "cycling", "bike", "car", "bus", "train"],
    },
    electricityUsage: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
