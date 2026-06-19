import { connectToDatabase } from "./db";
import CarbonRecord from "@/models/CarbonRecord";

/**
 * Calculates the Z-Score of a value compared to history values.
 */
export function calculateZScore(value: number, history: number[]): { zScore: number; mean: number; stdDev: number } {
  if (!history || history.length === 0) {
    return { zScore: 0, mean: 0, stdDev: 0 };
  }

  const sum = history.reduce((a, b) => a + b, 0);
  const mean = sum / history.length;

  if (history.length < 3) {
    // Insufficient data to determine std dev and z-score accurately
    return { zScore: 0, mean, stdDev: 0 };
  }

  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { zScore: 0, mean, stdDev: 0 };
  }

  const zScore = (value - mean) / stdDev;
  return { zScore, mean, stdDev };
}

/**
 * Server-side helper to check if a new daily entry is anomalous
 * based on the user's rolling 7-day average.
 */
export async function detectOutlier(
  userId: string,
  newTotalEmission: number,
  targetDate: string
): Promise<{ isOutlier: boolean; zScore: number; mean: number; stdDev: number }> {
  await connectToDatabase();

  // Find user's last 7 carbon records before the target date
  const pastRecords = await CarbonRecord.find({
    userId,
    date: { $lt: targetDate },
  })
    .sort({ date: -1 })
    .limit(7);

  const historyValues = pastRecords.map((r) => r.totalEmission);
  const { zScore, mean, stdDev } = calculateZScore(newTotalEmission, historyValues);

  // Z-Score threshold is 2.5 as requested
  const isOutlier = zScore > 2.5;

  return {
    isOutlier,
    zScore: Number(zScore.toFixed(3)),
    mean: Number(mean.toFixed(3)),
    stdDev: Number(stdDev.toFixed(3)),
  };
}
