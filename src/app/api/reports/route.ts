import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { generateUserReport } from "@/services/ai.service";
import Report from "@/models/Report";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch cached reports, latest first
    const reports = await Report.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Fetch reports API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
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
    const period = body.period || "weekly";

    if (period !== "weekly" && period !== "monthly") {
      return NextResponse.json({ error: "Invalid report period" }, { status: 400 });
    }

    const report = await generateUserReport(user._id.toString(), period);

    return NextResponse.json({
      message: `${period} report generated successfully`,
      report,
    });
  } catch (error: any) {
    console.error("Generate report API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
