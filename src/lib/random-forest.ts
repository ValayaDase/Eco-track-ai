import modelJson from "../../ml/model.json";

export type DayType = "Weekend" | "Weekday";
export type TransportMode = "EV" | "Walk" | "Bike" | "Bus" | "Car";
export type FoodType = "Veg" | "Mixed" | "Non-Veg";
export type CarbonImpactLevel = "Low" | "Medium" | "High";

export interface RandomForestInput {
  dayType: DayType;
  transportMode: TransportMode;
  distanceKm: number;
  electricityKwh: number;
  renewableUsagePct: number;
  foodType: FoodType;
  screenTimeHours: number;
  wasteGeneratedKg: number;
  ecoActions: number;
}

interface DecisionNode {
  feature?: number;
  threshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
  value?: number;
}

interface ModelData {
  metadata?: {
    metrics?: Record<string, number>;
  };
  classifier: DecisionNode[];
  regressor: DecisionNode[];
}

const MODEL = modelJson as ModelData;
const TRANSPORT_MAP: Record<TransportMode, number> = { EV: 0, Walk: 1, Bike: 2, Bus: 3, Car: 4 };
const FOOD_MAP: Record<FoodType, number> = { Veg: 0, Mixed: 1, "Non-Veg": 2 };
const DAY_MAP: Record<DayType, number> = { Weekday: 0, Weekend: 1 };
const LEVELS = ["Low", "Medium", "High"] as const;

function predictTree(node: DecisionNode, vector: number[]): number {
  if (typeof node.value === "number") {
    return node.value;
  }

  if (
    typeof node.feature !== "number" ||
    typeof node.threshold !== "number" ||
    !node.left ||
    !node.right
  ) {
    throw new Error("Invalid Random Forest model node.");
  }

  return vector[node.feature] <= node.threshold
    ? predictTree(node.left, vector)
    : predictTree(node.right, vector);
}

function predictForest(trees: DecisionNode[], vector: number[], mode: "classify" | "regress"): number {
  if (!trees.length) {
    throw new Error("Random Forest model has no trees.");
  }

  const predictions = trees.map((tree) => predictTree(tree, vector));

  if (mode === "regress") {
    return predictions.reduce((sum, prediction) => sum + prediction, 0) / predictions.length;
  }

  const votes = predictions.reduce<Record<number, number>>((counts, prediction) => {
    counts[prediction] = (counts[prediction] || 0) + 1;
    return counts;
  }, {});

  return Number(
    Object.entries(votes).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0]
  );
}

export function mapInputToVector(input: RandomForestInput): number[] {
  return [
    DAY_MAP[input.dayType],
    TRANSPORT_MAP[input.transportMode],
    input.distanceKm,
    input.electricityKwh,
    input.renewableUsagePct,
    FOOD_MAP[input.foodType],
    input.screenTimeHours,
    input.wasteGeneratedKg,
    input.ecoActions,
  ];
}

export function predictFootprint(input: RandomForestInput): number {
  const vector = mapInputToVector(input);
  return Math.max(0, predictForest(MODEL.regressor, vector, "regress"));
}

export function predictImpactLevel(input: RandomForestInput): CarbonImpactLevel {
  const vector = mapInputToVector(input);
  const classIndex = predictForest(MODEL.classifier, vector, "classify");
  return LEVELS[classIndex] ?? "Medium";
}

export function getModelMetrics() {
  return MODEL.metadata?.metrics ?? {};
}
