import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { inferTrend } from "@/lib/ai-engine";
import { classifyUserSegment } from "@/lib/clustering";
import { connectToDatabase } from "@/lib/db";
import { getLocalDateString } from "@/lib/helpers";
import Activity from "@/models/Activity";
import CarbonRecord from "@/models/CarbonRecord";

export const dynamic = "force-dynamic";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

function formatDisplayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const emptyEmissions = {
  transportEmission: 0,
  electricityEmission: 0,
  foodEmission: 0,
  wasteEmission: 0,
  shoppingEmission: 0,
  totalEmission: 0,
};

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const records = await CarbonRecord.find({ userId: user._id }).sort({ date: 1 });

    if (records.length === 0) {
      return NextResponse.json(
        {
          totalCarbon: 0,
          todayCarbon: 0,
          todayEmissions: emptyEmissions,
          reductionPercent: 0,
          recentActivities: [],
          trendChartData: [],
          segment: null,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    const totalCarbon = Number(records.reduce((sum, record) => sum + (record.totalEmission || 0), 0).toFixed(1));
    const todayStr = getLocalDateString();
    const todayRecord = records.find((record) => record.date === todayStr);
    const todayCarbon = Number((todayRecord?.totalEmission || 0).toFixed(1));
    const todayEmissions = todayRecord
      ? {
          transportEmission: Number((todayRecord.transportEmission || 0).toFixed(3)),
          electricityEmission: Number((todayRecord.electricityEmission || 0).toFixed(3)),
          foodEmission: Number((todayRecord.foodEmission || 0).toFixed(3)),
          wasteEmission: Number((todayRecord.wasteEmission || 0).toFixed(3)),
          shoppingEmission: Number((todayRecord.shoppingEmission || 0).toFixed(3)),
          totalEmission: Number((todayRecord.totalEmission || 0).toFixed(3)),
        }
      : emptyEmissions;

    const currentWeekRecords = records.slice(-7);
    const previousWeekRecords = records.slice(-14, -7);
    const currentWeekAverage = average(currentWeekRecords.map((record) => record.totalEmission || 0));
    const previousWeekAverage = average(previousWeekRecords.map((record) => record.totalEmission || 0));
    const reductionPercent = previousWeekAverage > 0
      ? Number((((previousWeekAverage - currentWeekAverage) / previousWeekAverage) * 100).toFixed(1))
      : 0;

    const last14Days = records.slice(-14);
    const emissionValues = last14Days.map((record) => record.totalEmission);
    const forecastValues = last14Days.length >= 7 ? await inferTrend(emissionValues) : [];
    const lastRecordDate = last14Days[last14Days.length - 1]?.date || todayStr;

    const chartHistory = last14Days.map((record, index) => ({
      displayDate: formatDisplayDate(record.date),
      Emissions: record.totalEmission,
      Forecast: index === last14Days.length - 1 && forecastValues.length > 0 ? record.totalEmission : null,
    }));

    const chartForecast = forecastValues.map((value, index) => ({
      displayDate: formatDisplayDate(addDays(lastRecordDate, index + 1)),
      Emissions: null,
      Forecast: value,
    }));

    const recentActivitiesRaw = await Activity.find({ userId: user._id }).sort({ date: -1 }).limit(4);
    const recentActivities = recentActivitiesRaw.map((activity) => ({
      date: activity.date,
      category: activity.carbonImpactLevel ? `${activity.carbonImpactLevel} impact audit` : "Daily audit",
      co2: records.find((record) => record.date === activity.date)?.totalEmission || 0,
    }));

    return NextResponse.json(
      {
        totalCarbon,
        todayCarbon,
        todayEmissions,
        reductionPercent,
        recentActivities,
        trendChartData: [...chartHistory, ...chartForecast],
        segment: classifyUserSegment(last14Days),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
