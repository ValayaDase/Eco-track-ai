import { ICarbonRecord } from "@/types/carbon";

export type UserSegment =
  | "Eco-Novice"
  | "Sustainable Commuter"
  | "Energy Conscious"
  | "Conscious Consumer"
  | "Low-Impact Pioneer";

export interface SegmentInfo {
  segment: UserSegment;
  title: string;
  badgeColor: string;
  description: string;
}

/**
 * Classifies users into dynamic lifestyle segments based on their emission distribution.
 */
export function classifyUserSegment(records: ICarbonRecord[]): SegmentInfo {
  const defaultSegment: SegmentInfo = {
    segment: "Eco-Novice",
    title: "Eco-Novice",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "You're at the beginning of your green journey. Keep tracking activities to discover key optimization spots!",
  };

  if (!records || records.length < 3) {
    return defaultSegment;
  }

  let totalTransport = 0;
  let totalElectricity = 0;
  let totalFood = 0;
  let totalWaste = 0;
  let totalShopping = 0;
  let grandTotal = 0;

  for (const r of records) {
    totalTransport += r.transportEmission || 0;
    totalElectricity += r.electricityEmission || 0;
    totalFood += r.foodEmission || 0;
    totalWaste += r.wasteEmission || 0;
    totalShopping += r.shoppingEmission || 0;
    grandTotal += r.totalEmission || 0;
  }

  if (grandTotal === 0) {
    return defaultSegment;
  }

  const pTransport = totalTransport / grandTotal;
  const pElectricity = totalElectricity / grandTotal;
  const pFood = totalFood / grandTotal;
  const pWaste = totalWaste / grandTotal;
  const pShopping = totalShopping / grandTotal;

  const avgDaily = grandTotal / records.length;

  // 1. Eco-Novice
  // If the user's average emissions are high and they don't have a structured optimization yet
  if (avgDaily > 20) {
    return defaultSegment;
  }

  // 2. Low-Impact Pioneer
  // If overall daily emissions are extremely low across the board
  if (avgDaily < 8) {
    return {
      segment: "Low-Impact Pioneer",
      title: "Low-Impact Pioneer",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      description: "Exceptional sustainability performance! You maintain a tiny carbon footprint across all aspects of daily life.",
    };
  }

  // 3. Sustainable Commuter
  // If transport emissions are very low (either transport is < 15% of footprint or they have low transport footprint)
  if (pTransport < 0.15 || totalTransport / records.length < 1.5) {
    return {
      segment: "Sustainable Commuter",
      title: "Sustainable Commuter",
      badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      description: "Walking, cycling, or using public transit are second nature to you. Your commute has an incredibly low footprint!",
    };
  }

  // 4. Energy Conscious
  // If home utilities/electricity emissions are very low
  if (pElectricity < 0.20 || totalElectricity / records.length < 2.5) {
    return {
      segment: "Energy Conscious",
      title: "Energy Conscious",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      description: "You excel at saving energy. Standby loads and high cooling demands are minimized in your household.",
    };
  }

  // 5. Conscious Consumer
  // If waste and shopping emissions are low
  if (pShopping < 0.10 && pWaste < 0.05) {
    return {
      segment: "Conscious Consumer",
      title: "Conscious Consumer",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      description: "You avoid single-use plastic waste and follow mindful purchasing habits, extending product lifecycles.",
    };
  }

  // Fallback to general low impact or novice depending on avgDaily
  if (avgDaily < 14) {
    return {
      segment: "Energy Conscious", // default green segment if balanced and relatively low
      title: "Energy Conscious",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      description: "You are actively optimizing your daily metrics. Home energy and diet are well-managed.",
    };
  }

  return defaultSegment;
}
