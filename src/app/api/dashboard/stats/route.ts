// data with seeding automatic data insert hoga database mei
// import { NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/db";
// import { getUserFromSession } from "@/lib/auth";
// import CarbonRecord from "@/models/CarbonRecord";
// import Activity from "@/models/Activity";
// import Profile from "@/models/Profile";
// import { EMISSION_FACTORS } from "@/constants/emissions";
// import { inferTrend } from "@/lib/ai-engine";
// import { classifyUserSegment } from "@/lib/clustering";
// import { getLocalDateString } from "@/lib/helpers";

// export async function GET() {
//   try {
//     const user = await getUserFromSession();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     // 1. Check user carbon records
//     let records = await CarbonRecord.find({ userId: user._id }).sort({ date: 1 });

//     // If fewer than 14 records, automatically seed history using profile details
//     if (records.length < 14) {
//       const profile = await Profile.findOne({ userId: user._id });
//       await seedUserHistory(user._id.toString(), profile);
//       // Re-fetch records
//       records = await CarbonRecord.find({ userId: user._id }).sort({ date: 1 });
//     }

//     // 2. Compute lifetime carbon sum
//     const totalCarbon = Number(records.reduce((sum, r) => sum + (r.totalEmission || 0), 0).toFixed(1));

//     // 3. Compute today's emission
//     const todayStr = getLocalDateString();
//     const todayRecord = records.find((r) => r.date === todayStr);
//     const todayCarbon = todayRecord ? todayRecord.totalEmission : 0.0;

//     // 4. Compute weekly reduction percentage dynamically
//     // We compare the average emissions of the last 7 days vs the 7 days prior
//     const sortedDesc = [...records].sort((a, b) => b.date.localeCompare(a.date));
//     const recent7 = sortedDesc.slice(0, 7);
//     const previous7 = sortedDesc.slice(7, 14);

//     let reductionPercent = 0;
//     if (recent7.length > 0 && previous7.length > 0) {
//       const avgRecent = recent7.reduce((sum, r) => sum + r.totalEmission, 0) / recent7.length;
//       const avgPrevious = previous7.reduce((sum, r) => sum + r.totalEmission, 0) / previous7.length;
      
//       if (avgPrevious > 0) {
//         reductionPercent = Number((((avgPrevious - avgRecent) / avgPrevious) * 100).toFixed(1));
//       }
//     }

//     // 5. Get recent 4 daily activities from DB (no more hardcoded recent daily audits)
//     const recentActivitiesRaw = await Activity.find({ userId: user._id })
//       .sort({ date: -1 })
//       .limit(4);

//     const categoryDisplayName = (act: any) => {
//       const categories = [];
//       if (act.carDistance || act.busDistance || act.trainDistance) categories.push("Commute");
//       if (act.electricityUnits || act.acHours) categories.push("Energy");
//       if (act.shoppingCount) categories.push("Shopping");
//       if (act.plasticUsage) categories.push("Waste");
//       if (act.foodType) categories.push("Diet");
//       return categories.length > 0 ? categories.slice(0, 2).join(" & ") : "General Audit";
//     };

//     const recentActivities = recentActivitiesRaw.map((act) => {
//       const emissions = records.find((r) => r.date === act.date);
//       return {
//         date: act.date,
//         category: categoryDisplayName(act),
//         co2: emissions ? emissions.totalEmission : 0.0,
//       };
//     });

//     // 6. Predict emissions trajectory using TensorFlow.js
//     const last14DaysEmissions = records.slice(-14).map((r) => r.totalEmission);
//     const forecastValues = await inferTrend(last14DaysEmissions);

//     // 7. Format Trend Chart Data
//     // Historical trends
//     const chartHistory = records.slice(-14).map((r) => {
//       const dateObj = new Date(r.date + "T00:00:00");
//       const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
//       const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
//       return {
//         date: r.date,
//         day: dayName,
//         displayDate,
//         Emissions: r.totalEmission,
//         Forecast: null,
//       };
//     });

//     // Append forecast values (starting from the last historical point to make it connect)
//     const chartForecast = [];
//     if (chartHistory.length > 0) {
//       const lastHist = chartHistory[chartHistory.length - 1];
//       // Set the forecast for the last historical point to connect lines
//       lastHist.Forecast = lastHist.Emissions;
      
//       const lastDate = new Date(lastHist.date + "T00:00:00");
//       for (let i = 0; i < 7; i++) {
//         const nextDate = new Date(lastDate);
//         nextDate.setDate(lastDate.getDate() + i + 1);
//         const nextDateStr = nextDate.toISOString().split("T")[0];
//         const dayName = nextDate.toLocaleDateString("en-US", { weekday: "short" });
//         const displayDate = nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " (Est)";
        
//         chartForecast.push({
//           date: nextDateStr,
//           day: dayName,
//           displayDate,
//           Emissions: null,
//           Forecast: forecastValues[i],
//         });
//       }
//     }

//     const trendChartData = [...chartHistory, ...chartForecast];

//     // 8. Classify user segment
//     const segmentInfo = classifyUserSegment(records.slice(-14));

//     // Today's category breakdown
//     const todayActivity = await Activity.findOne({ userId: user._id, date: todayStr });
//     const todayEmissions = todayActivity ? records.find((r) => r.date === todayStr) : null;
    
//     return NextResponse.json({
//       totalCarbon,
//       todayCarbon,
//       reductionPercent,
//       recentActivities,
//       trendChartData,
//       segment: segmentInfo,
//       todayEmissions: todayEmissions || {
//         transportEmission: 0,
//         electricityEmission: 0,
//         foodEmission: 0,
//         wasteEmission: 0,
//         shoppingEmission: 0,
//         totalEmission: 0,
//       },
//     });

//   } catch (error: any) {
//     console.error("Dashboard Stats API Error:", error);
//     return NextResponse.json({ error: error.message || "Failed to load dashboard metrics" }, { status: 500 });
//   }
// }

// async function seedUserHistory(userId: string, profile: any) {
//   const today = new Date();
//   const recordsToCreate = [];

//   const foodType = profile?.dietType || "vegan";
//   const foodBase = EMISSION_FACTORS.food[foodType as keyof typeof EMISSION_FACTORS.food] || 0.6;
//   const foodEmission = foodBase * 3;

//   const transportMode = profile?.transportMode || "car";
//   const transportBase = EMISSION_FACTORS.transport[transportMode as keyof typeof EMISSION_FACTORS.transport] || 0.171;
//   const transportEmission = transportBase * 15;

//   const electricityLevel = profile?.electricityUsage || "medium";
//   const electricityUnits = electricityLevel === "low" ? 4 : electricityLevel === "medium" ? 10 : 18;
//   const electricityEmission = electricityUnits * EMISSION_FACTORS.electricity.perKwh;

//   const wasteEmission = 2 * EMISSION_FACTORS.waste.perPlasticItem;
//   const shoppingEmission = 0.2 * EMISSION_FACTORS.shopping.perItem;

//   for (let i = 14; i >= 1; i--) {
//     const date = new Date(today);
//     date.setDate(today.getDate() - i);
//     const dateStr = date.toISOString().split("T")[0];

//     const varFactor = 0.75 + Math.random() * 0.5; // -25% to +25%

//     const record = {
//       userId,
//       date: dateStr,
//       transportEmission: Number((transportEmission * varFactor).toFixed(2)),
//       electricityEmission: Number((electricityEmission * varFactor).toFixed(2)),
//       foodEmission: Number((foodEmission * varFactor).toFixed(2)),
//       wasteEmission: Number((wasteEmission * varFactor).toFixed(2)),
//       shoppingEmission: Number((shoppingEmission * varFactor).toFixed(2)),
//       totalEmission: 0,
//     };

//     record.totalEmission = Number((
//       record.transportEmission +
//       record.electricityEmission +
//       record.foodEmission +
//       record.wasteEmission +
//       record.shoppingEmission
//     ).toFixed(2));

//     recordsToCreate.push(record);
    
//     // Seed Activity matching
//     const activityLog = {
//       userId,
//       date: dateStr,
//       walkingDistance: transportMode === "walking" ? 15 : 0,
//       cyclingDistance: transportMode === "cycling" ? 15 : 0,
//       bikeDistance: transportMode === "bike" ? 15 : 0,
//       carDistance: transportMode === "car" ? 15 : 0,
//       busDistance: transportMode === "bus" ? 15 : 0,
//       trainDistance: transportMode === "train" ? 15 : 0,
//       electricityUnits,
//       acHours: 2,
//       foodType,
//       plasticUsage: 2,
//       shoppingCount: 0,
//     };
    
//     await Activity.findOneAndUpdate({ userId, date: dateStr }, activityLog, { upsert: true });
//   }

//   await CarbonRecord.insertMany(recordsToCreate);
// }

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth";
import CarbonRecord from "@/models/CarbonRecord";
import Activity from "@/models/Activity";
import { inferTrend } from "@/lib/ai-engine";
import { classifyUserSegment } from "@/lib/clustering";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    // SIRF REAL DATA FETCH KAREIN (No seeding)
    const records = await CarbonRecord.find({ userId: user._id }).sort({ date: 1 });

    if (records.length === 0) {
      return NextResponse.json({ 
        totalCarbon: 0, todayCarbon: 0, recentActivities: [], trendChartData: [], segment: null 
      });
    }

    // 1. Dashboard Metrics
    const totalCarbon = Number(records.reduce((sum, r) => sum + (r.totalEmission || 0), 0).toFixed(1));
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = records.find((r) => r.date === todayStr);
    const todayCarbon = todayRecord ? todayRecord.totalEmission : 0.0;

    // 2. Real Weekly Trend (AI Analysis)
    const last14Days = records.slice(-14);
    const emissionValues = last14Days.map(r => r.totalEmission);
    
    // AI Inference
    const forecastValues = last14Days.length >= 7 ? await inferTrend(emissionValues) : [];

    // 3. Chart Data Generation
    const chartHistory = last14Days.map(r => ({
      displayDate: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Emissions: r.totalEmission,
      Forecast: null
    }));

    const chartForecast = forecastValues.map((val, i) => ({
      displayDate: `Est ${i+1}`,
      Emissions: null,
      Forecast: val
    }));

    const trendChartData = [...chartHistory, ...chartForecast];

    // 4. Activity Logs (Real)
    const recentActivitiesRaw = await Activity.find({ userId: user._id }).sort({ date: -1 }).limit(4);
    const recentActivities = recentActivitiesRaw.map(act => ({
      date: act.date,
      category: "Daily Audit",
      co2: records.find(r => r.date === act.date)?.totalEmission || 0
    }));

    return NextResponse.json({
      totalCarbon,
      todayCarbon,
      recentActivities,
      trendChartData,
      segment: classifyUserSegment(last14Days)
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}