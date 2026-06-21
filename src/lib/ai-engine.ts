/**
 * Forecast the next 7 logged-day emissions with deterministic least-squares regression.
 * The slope is damped by fit quality so noisy daily entries do not produce wild projections.
 */
export async function inferTrend(last14Days: number[]): Promise<number[]> {
  const values = (last14Days || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.max(0, value));

  if (values.length === 0) {
    return Array(7).fill(0);
  }

  if (values.length === 1) {
    return Array(7).fill(Number(values[0].toFixed(2)));
  }

  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value, index) => ({ x: index - xMean, y: value - yMean }));
  const denominator = centered.reduce((sum, point) => sum + point.x ** 2, 0) || 1;
  const slope = centered.reduce((sum, point) => sum + point.x * point.y, 0) / denominator;
  const intercept = yMean - slope * xMean;
  const totalVariance = values.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const residualVariance = values.reduce((sum, value, index) => {
    const prediction = intercept + slope * index;
    return sum + (value - prediction) ** 2;
  }, 0);
  const rSquared = totalVariance > 0 ? Math.max(0, 1 - residualVariance / totalVariance) : 0;
  const dampedSlope = slope * Math.min(1, rSquared + 0.25);
  const rollingAverage = values.slice(-Math.min(7, values.length)).reduce((sum, value) => sum + value, 0) / Math.min(7, values.length);
  const lastValue = values[values.length - 1];

  const predictions = Array.from({ length: 7 }, (_, index) => {
    const projected = lastValue + dampedSlope * (index + 1);
    const blended = projected * 0.65 + rollingAverage * 0.35;
    return Number(Math.max(0, blended).toFixed(2));
  });

  return predictions;
}
