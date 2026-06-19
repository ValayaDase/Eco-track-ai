import { connectToDatabase } from "@/lib/db";
import Profile from "@/models/Profile";
import Activity from "@/models/Activity";
import CarbonRecord from "@/models/CarbonRecord";
import Report from "@/models/Report";
import { getAIRecommendations, getAIReport } from "@/lib/gemini";

import { classifyUserSegment } from "@/lib/clustering";

/**
 * Loads user details and recent logs, formatting them for the Gemini prompt context.
 */
export async function generateUserRecommendations(userId: string) {
  await connectToDatabase();

  const profile = await Profile.findOne({ userId });
  const activities = await Activity.find({ userId }).sort({ date: -1 }).limit(7);
  const carbonRecords = await CarbonRecord.find({ userId }).sort({ date: -1 }).limit(14);

  const segmentInfo = classifyUserSegment(carbonRecords);

  // Format profile
  const profileText = profile
    ? `Age: ${profile.age}, Location: ${profile.city}, ${profile.country}, Occupation: ${profile.occupation}, Family Size: ${profile.familySize}, Baseline Diet: ${profile.dietType}, Commute Mode: ${profile.transportMode}, Electricity Usage: ${profile.electricityUsage}`
    : "No baseline profile configured.";

  // Format activities
  const activitiesText = activities.length > 0
    ? activities
        .map(
          (act) =>
            `Date: ${act.date}, Car: ${act.carDistance}km, Bus: ${act.busDistance}km, Train: ${act.trainDistance}km, Bike: ${act.bikeDistance}km, Walk: ${act.walkingDistance}km, Electricity: ${act.electricityUnits}kWh, AC: ${act.acHours}hrs, Diet: ${act.foodType}, Plastic: ${act.plasticUsage} items, Goods: ${act.shoppingCount} items`
        )
        .join("\n")
    : "No logged daily activities found.";

  const recommendations = await getAIRecommendations(profileText, activitiesText, segmentInfo.segment);
  return {
    recommendations,
    segment: segmentInfo,
  };
}

/**
 * Compiles a weekly/monthly PDF-ready report, caching results in MongoDB.
 */
export async function generateUserReport(userId: string, period: "weekly" | "monthly") {
  await connectToDatabase();

  const profile = await Profile.findOne({ userId });
  
  // Define time range
  const days = period === "weekly" ? 7 : 30;
  const records = await CarbonRecord.find({ userId }).sort({ date: -1 }).limit(days);

  // Format profile
  const profileText = profile
    ? `Age: ${profile.age}, Location: ${profile.city}, ${profile.country}, Occupation: ${profile.occupation}, Family Size: ${profile.familySize}, Baseline Diet: ${profile.dietType}`
    : "No profile configured.";

  // Format records
  const recordsText = records.length > 0
    ? records
        .map(
          (rec) =>
            `Date: ${rec.date}, Transport Emission: ${rec.transportEmission}kg, Electricity: ${rec.electricityEmission}kg, Food: ${rec.foodEmission}kg, Waste: ${rec.wasteEmission}kg, Shopping: ${rec.shoppingEmission}kg, Total: ${rec.totalEmission}kg`
        )
        .join("\n")
    : "No carbon records found for the requested period.";

  // Generate AI Report
  const aiReport = await getAIReport(profileText, recordsText, period);

  // Compute identifiers for caching
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const weekIdentifier = period === "weekly" ? `${now.getFullYear()}-W${getWeekNumber(now)}` : null;
  const monthIdentifier = period === "monthly" ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` : null;

  // Cache report in DB
  const savedReport = await Report.create({
    userId,
    week: weekIdentifier,
    month: monthIdentifier,
    summary: aiReport.summary,
    recommendations: aiReport.recommendations,
  });

  return savedReport;
}

// Helper to extract ISO week number
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}
