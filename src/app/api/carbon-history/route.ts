import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth";
import CarbonRecord from "@/models/CarbonRecord";

export async function GET(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "weekly";
    const limit = period === "monthly" ? 30 : 7;

    await connectToDatabase();

    const records = await CarbonRecord.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(limit);

    // Sort ascending for chronological chart plotting
    const sortedRecords = [...records].reverse();

    const chartData = sortedRecords.map((r) => {
      const dateObj = new Date(r.date + "T00:00:00");
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      return {
        day: dayName,
        date: r.date,
        Emissions: r.totalEmission,
      };
    });

    return NextResponse.json({ chartData });
  } catch (error: any) {
    console.error("Fetch carbon history error:", error);
    return NextResponse.json({ error: "Failed to fetch carbon history" }, { status: 500 });
  }
}
