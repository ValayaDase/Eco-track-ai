import { EMISSION_FACTORS } from "@/constants/emissions";

export interface CalculateEmissionsInput {
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
}

export function calculateCategoryEmissions(input: Partial<CalculateEmissionsInput>) {
  const walking = Number(input.walkingDistance) || 0;
  const cycling = Number(input.cyclingDistance) || 0;
  const bike = Number(input.bikeDistance) || 0;
  const car = Number(input.carDistance) || 0;
  const bus = Number(input.busDistance) || 0;
  const train = Number(input.trainDistance) || 0;

  const electricity = Number(input.electricityUnits) || 0;
  const ac = Number(input.acHours) || 0;

  const foodType = input.foodType || "vegan";
  const plastic = Number(input.plasticUsage) || 0;
  const shopping = Number(input.shoppingCount) || 0;

  // 1. Transport Emissions
  const transportEmission =
    walking * EMISSION_FACTORS.transport.walking +
    cycling * EMISSION_FACTORS.transport.cycling +
    bike * EMISSION_FACTORS.transport.bike +
    car * EMISSION_FACTORS.transport.car +
    bus * EMISSION_FACTORS.transport.bus +
    train * EMISSION_FACTORS.transport.train;

  // 2. Electricity/AC Emissions
  const electricityEmission =
    electricity * EMISSION_FACTORS.electricity.perKwh +
    ac * EMISSION_FACTORS.electricity.acPerHour;

  // 3. Food Emissions (3 meals a day base scale)
  const foodFactor = EMISSION_FACTORS.food[foodType as keyof typeof EMISSION_FACTORS.food] || 0.6;
  const foodEmission = foodFactor * 3;

  // 4. Waste / Plastic Emissions
  const wasteEmission = plastic * EMISSION_FACTORS.waste.perPlasticItem;

  // 5. Shopping Emissions
  const shoppingEmission = shopping * EMISSION_FACTORS.shopping.perItem;

  // 6. Grand Total
  const totalEmission =
    transportEmission + electricityEmission + foodEmission + wasteEmission + shoppingEmission;

  return {
    transportEmission: Number(transportEmission.toFixed(3)),
    electricityEmission: Number(electricityEmission.toFixed(3)),
    foodEmission: Number(foodEmission.toFixed(3)),
    wasteEmission: Number(wasteEmission.toFixed(3)),
    shoppingEmission: Number(shoppingEmission.toFixed(3)),
    totalEmission: Number(totalEmission.toFixed(3)),
  };
}
