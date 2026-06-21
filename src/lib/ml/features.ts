import type { CalculateEmissionsInput } from "@/lib/calculations";

export type CarbonImpactLevel = "Low" | "Medium" | "High";

export interface MlPrediction {
  carbon_footprint_kg: number;
  carbon_impact_level: CarbonImpactLevel;
}

type ActivityLike = Partial<CalculateEmissionsInput>;

const TRANSPORT_MODE_ENC = {
  EV: 0,
  Walk: 1,
  Bike: 2,
  Bus: 3,
  Car: 4,
} as const;

const FOOD_TYPE_ENC = {
  Veg: 0,
  Mixed: 1,
  "Non-Veg": 2,
} as const;
const AC_KWH_PER_HOUR = 1.5;

function nonNegative(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getDayTypeEnc(date?: string) {
  if (!date) return 0;

  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6 ? 1 : 0;
}

function getDominantTransportMode(input: ActivityLike) {
  const distances = [
    { mode: "Walk", distance: nonNegative(input.walkingDistance) },
    { mode: "Bike", distance: nonNegative(input.cyclingDistance) + nonNegative(input.bikeDistance) },
    { mode: "Car", distance: nonNegative(input.carDistance) },
    { mode: "Bus", distance: nonNegative(input.busDistance) + nonNegative(input.trainDistance) },
  ] as const;

  const dominant = distances.reduce((best, current) =>
    current.distance > best.distance ? current : best
  );

  return dominant.distance > 0 ? dominant.mode : "Walk";
}

function getFoodTypeEnc(foodType?: string) {
  if (foodType === "vegan" || foodType === "vegetarian") {
    return FOOD_TYPE_ENC.Veg;
  }

  if (foodType === "meat-heavy") {
    return FOOD_TYPE_ENC["Non-Veg"];
  }

  return FOOD_TYPE_ENC.Mixed;
}

export function buildMlFeatureVector(input: ActivityLike): number[] {
  const transportMode = getDominantTransportMode(input);
  const distanceKm =
    nonNegative(input.walkingDistance) +
    nonNegative(input.cyclingDistance) +
    nonNegative(input.bikeDistance) +
    nonNegative(input.carDistance) +
    nonNegative(input.busDistance) +
    nonNegative(input.trainDistance);
  const electricityKwh = nonNegative(input.electricityUnits) + nonNegative(input.acHours) * AC_KWH_PER_HOUR;

  return [
    getDayTypeEnc(input.date),
    TRANSPORT_MODE_ENC[transportMode],
    distanceKm,
    electricityKwh,
    Math.min(100, nonNegative(input.renewableUsagePct)),
    getFoodTypeEnc(input.foodType),
    Math.min(24, nonNegative(input.screenTimeHours)),
    nonNegative(input.wasteGeneratedKg),
    nonNegative(input.ecoActions),
  ];
}
