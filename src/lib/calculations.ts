import type { CarbonImpactLevel } from "@/lib/random-forest";

export interface CalculateEmissionsInput {
  date?: string;
  walkingDistance: number;
  cyclingDistance: number;
  bikeDistance: number;
  carDistance: number;
  busDistance: number;
  trainDistance: number;
  electricityUnits: number;
  acHours: number;
  foodType: string;
  plasticUsage: number;
  shoppingCount: number;
  renewableUsagePct: number;
  screenTimeHours: number;
  wasteGeneratedKg: number;
  ecoActions: number;
}

// Operational factors in kg CO2e. Explicit factors keep every input's effect
// continuous and auditable instead of hiding changes behind tree split points.
export const EMISSION_FACTORS = {
  transportPerKm: {
    walking: 0,
    cycling: 0,
    bike: 0.113,
    car: 0.171,
    bus: 0.096,
    train: 0.035,
  },
  gridElectricityPerKwh: 0.475,
  acKwhPerHour: 1.5,
  screenKwhPerHour: 0.06,
  foodPerDay: {
    vegan: 1.8,
    vegetarian: 2.4,
    pescatarian: 3.6,
    "meat-heavy": 7.5,
  },
  plasticItem: 0.05,
  generalWastePerKg: 0.46,
  purchasedItem: 6,
  ecoActionReduction: 0.02,
} as const;

function nonNegative(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function getImpactLevel(total: number): CarbonImpactLevel {
  if (total < 5) return "Low";
  if (total < 10) return "Medium";
  return "High";
}

export function calculateCategoryEmissions(input: Partial<CalculateEmissionsInput>) {
  const renewableShare = Math.min(100, nonNegative(input.renewableUsagePct)) / 100;
  const gridShare = 1 - renewableShare;

  const transportEmission =
    nonNegative(input.walkingDistance) * EMISSION_FACTORS.transportPerKm.walking +
    nonNegative(input.cyclingDistance) * EMISSION_FACTORS.transportPerKm.cycling +
    nonNegative(input.bikeDistance) * EMISSION_FACTORS.transportPerKm.bike +
    nonNegative(input.carDistance) * EMISSION_FACTORS.transportPerKm.car +
    nonNegative(input.busDistance) * EMISSION_FACTORS.transportPerKm.bus +
    nonNegative(input.trainDistance) * EMISSION_FACTORS.transportPerKm.train;

  const electricityKwh =
    nonNegative(input.electricityUnits) +
    Math.min(24, nonNegative(input.acHours)) * EMISSION_FACTORS.acKwhPerHour +
    Math.min(24, nonNegative(input.screenTimeHours)) * EMISSION_FACTORS.screenKwhPerHour;
  const electricityEmission = electricityKwh * EMISSION_FACTORS.gridElectricityPerKwh * gridShare;

  const foodType = input.foodType as keyof typeof EMISSION_FACTORS.foodPerDay;
  const foodEmission = EMISSION_FACTORS.foodPerDay[foodType] ?? 0;
  const wasteEmission =
    nonNegative(input.plasticUsage) * EMISSION_FACTORS.plasticItem +
    nonNegative(input.wasteGeneratedKg) * EMISSION_FACTORS.generalWastePerKg;
  const shoppingEmission = nonNegative(input.shoppingCount) * EMISSION_FACTORS.purchasedItem;

  const actionReduction = Math.min(
    0.2,
    nonNegative(input.ecoActions) * EMISSION_FACTORS.ecoActionReduction
  );
  const reductionMultiplier = 1 - actionReduction;
  const result = {
    transportEmission: round(transportEmission * reductionMultiplier),
    electricityEmission: round(electricityEmission * reductionMultiplier),
    foodEmission: round(foodEmission * reductionMultiplier),
    wasteEmission: round(wasteEmission * reductionMultiplier),
    shoppingEmission: round(shoppingEmission * reductionMultiplier),
  };
  const totalEmission = round(Object.values(result).reduce((sum, value) => sum + value, 0));

  return {
    ...result,
    totalEmission,
    carbonImpactLevel: getImpactLevel(totalEmission),
  };
}
