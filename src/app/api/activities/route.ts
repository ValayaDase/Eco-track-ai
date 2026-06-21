import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Activity from "@/models/Activity";
import CarbonRecord from "@/models/CarbonRecord";
import Profile from "@/models/Profile";
import { getUserFromSession } from "@/lib/auth";
import { ActivitySchema } from "@/lib/validations";
import { calculateCategoryEmissions } from "@/lib/calculations";
import { getLocalDateString } from "@/lib/helpers";
import { detectOutlier } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getLocalDateString();

    await connectToDatabase();

    // Find user's activity for this date
    const [activity, profile] = await Promise.all([
      Activity.findOne({ userId: user._id, date }),
      Profile.findOne({ userId: user._id }).select("dietType"),
    ]);

    // Fetch rolling stats (past 7 logged carbon records prior to this date)
    const pastRecords = await CarbonRecord.find({
      userId: user._id,
      date: { $lt: date },
    })
      .sort({ date: -1 })
      .limit(7);

    const historyValues = pastRecords.map((r) => r.totalEmission);
    let mean = 0;
    let stdDev = 0;
    if (historyValues.length > 0) {
      const sum = historyValues.reduce((a, b) => a + b, 0);
      mean = sum / historyValues.length;
      if (historyValues.length >= 3) {
        const variance = historyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historyValues.length;
        stdDev = Math.sqrt(variance);
      }
    }

    const emissions = activity
      ? calculateCategoryEmissions({ ...activity.toObject(), date })
      : calculateCategoryEmissions({ date, foodType: profile?.dietType || "vegetarian" });

    return NextResponse.json(
      {
        activity,
        emissions,
        defaults: { foodType: profile?.dietType || "vegetarian" },
        rollingStats: {
          mean,
          stdDev,
          count: historyValues.length,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error: any) {
    console.error("Get activity log error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const date = body.date || getLocalDateString();

    // Validate body
    const validated = ActivitySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Compute the same auditable category estimate shown by the client.
    const emissions = calculateCategoryEmissions({ ...validated.data, date });

    // Perform Outlier Detection (Z-Score analysis)
    const { isOutlier, zScore, mean, stdDev } = await detectOutlier(
      user._id.toString(),
      emissions.totalEmission,
      date
    );

    // If outlier and not confirmed, return a warning blocking the save
    if (isOutlier && body.confirmed !== true) {
      return NextResponse.json(
        {
          error: "Data Quality Warning: Today's carbon footprint is anomalous.",
          requiresConfirmation: true,
          zScore,
          mean,
          stdDev,
          proposedEmission: emissions.totalEmission,
        },
        { status: 400 }
      );
    }

    // 1. Create or Update daily activity document
    const activity = await Activity.findOneAndUpdate(
      { userId: user._id, date },
      { userId: user._id, date, ...validated.data, carbonImpactLevel: emissions.carbonImpactLevel },
      { new: true, upsert: true }
    );

    // 2. Sync with CarbonRecord model
    const carbonRecord = await CarbonRecord.findOneAndUpdate(
      { userId: user._id, date },
      {
        userId: user._id,
        date,
        transportEmission: emissions.transportEmission,
        electricityEmission: emissions.electricityEmission,
        foodEmission: emissions.foodEmission,
        wasteEmission: emissions.wasteEmission,
        shoppingEmission: emissions.shoppingEmission,
        totalEmission: emissions.totalEmission,
        carbonImpactLevel: emissions.carbonImpactLevel,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "Daily activity and emissions estimate saved",
      activity,
      carbonRecord,
      emissions,
      zScore,
    });
  } catch (error: any) {
    console.error("Save activity log error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
