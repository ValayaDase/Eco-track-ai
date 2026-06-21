"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Cpu, Trees, Zap, Smartphone, RefreshCw, Loader2 } from "lucide-react";
import { calculateCategoryEmissions } from "@/lib/calculations";
import { buildMlFeatureVector, type MlPrediction } from "@/lib/ml/features";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProfileBaseline = {
  dietType?: string;
  transportMode?: string;
  electricityUsage?: string;
  familySize?: number;
};

export default function SimulatorPage() {
  const [profile, setProfile] = useState<ProfileBaseline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baselinePrediction, setBaselinePrediction] = useState<MlPrediction | null>(null);
  const [simulatedPrediction, setSimulatedPrediction] = useState<MlPrediction | null>(null);

  // Simulation Sliders State
  const [simCar, setSimCar] = useState(20); // km/day
  const [simTransit, setSimTransit] = useState(15); // km/day
  const [simElectricity, setSimElectricity] = useState(10); // kWh/day
  const [simAC, setSimAC] = useState(4); // hours/day
  const [simDiet, setSimDiet] = useState("vegetarian");
  const [simShopping, setSimShopping] = useState(1); // items/week
  const [simRenewable, setSimRenewable] = useState(0); // percent
  const [simScreen, setSimScreen] = useState(4); // hours/day
  const [simWaste, setSimWaste] = useState(0.5); // kg/day
  const [simEcoActions, setSimEcoActions] = useState(1); // count/day

  // Fetch baseline profile info
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);

          // Calibrate simulator defaults based on profile
          const p = data.profile;
          setSimDiet(p.dietType || "vegetarian");
          setSimCar(p.transportMode === "car" ? 25 : 0);
          setSimTransit(p.transportMode === "bus" ? 15 : p.transportMode === "train" ? 20 : 0);
          setSimAC(p.electricityUsage === "high" ? 8 : p.electricityUsage === "medium" ? 4 : 1);
          setSimElectricity(p.electricityUsage === "high" ? 18 : p.electricityUsage === "medium" ? 10 : 5);
          setSimRenewable(0);
          setSimScreen(4);
          setSimWaste(p.familySize > 3 ? 0.9 : 0.5);
          setSimEcoActions(1);
        }
      } catch (err) {
        console.error("Failed to fetch profile baseline:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Compute Baseline emissions based on user profile
  const getBaselineInputs = useCallback(() => {
    if (!profile) {
      return {
        walkingDistance: 2,
        cyclingDistance: 1,
        bikeDistance: 0,
        carDistance: 20,
        busDistance: 15,
        trainDistance: 0,
        electricityUnits: 10,
        acHours: 4,
        foodType: "vegetarian",
      plasticUsage: 3,
      shoppingCount: 1 / 7,
      renewableUsagePct: 0,
      screenTimeHours: 4,
      wasteGeneratedKg: 0.5,
      ecoActions: 1,
    };
    }

    const mode = profile.transportMode;
    const elec = profile.electricityUsage;

    return {
      walkingDistance: mode === "walking" ? 4 : 1,
      cyclingDistance: mode === "cycling" ? 6 : 0,
      bikeDistance: mode === "bike" ? 15 : 0,
      carDistance: mode === "car" ? 25 : 0,
      busDistance: mode === "bus" ? 15 : 0,
      trainDistance: mode === "train" ? 20 : 0,
      electricityUnits: elec === "high" ? 18 : elec === "medium" ? 10 : 5,
      acHours: elec === "high" ? 8 : elec === "medium" ? 4 : 1,
      foodType: profile.dietType || "vegetarian",
      plasticUsage: (profile.familySize ?? 1) > 3 ? 5 : 2,
      shoppingCount: 1 / 7,
      renewableUsagePct: 0,
      screenTimeHours: 4,
      wasteGeneratedKg: (profile.familySize ?? 1) > 3 ? 0.9 : 0.5,
      ecoActions: 1,
    };
  }, [profile]);

  const baselineInputs = useMemo(() => getBaselineInputs(), [getBaselineInputs]);
  const baselineCategoryEmissions = calculateCategoryEmissions(baselineInputs);

  // Compute Simulated emissions
  const simulatedInputs = useMemo(() => ({
    ...baselineInputs,
    carDistance: simCar,
    busDistance: profile?.transportMode === "train" ? 0 : simTransit,
    trainDistance: profile?.transportMode === "train" ? simTransit : 0,
    electricityUnits: simElectricity,
    acHours: simAC,
    foodType: simDiet,
    shoppingCount: simShopping / 7,
    renewableUsagePct: simRenewable,
    screenTimeHours: simScreen,
    wasteGeneratedKg: simWaste,
    ecoActions: simEcoActions,
  }), [
    baselineInputs,
    profile?.transportMode,
    simCar,
    simTransit,
    simElectricity,
    simAC,
    simDiet,
    simShopping,
    simRenewable,
    simScreen,
    simWaste,
    simEcoActions,
  ]);
  const simulatedCategoryEmissions = calculateCategoryEmissions(simulatedInputs);
  const baselineEmissions = {
    ...baselineCategoryEmissions,
    totalEmission: baselinePrediction?.carbon_footprint_kg ?? baselineCategoryEmissions.totalEmission,
    carbonImpactLevel: baselinePrediction?.carbon_impact_level ?? baselineCategoryEmissions.carbonImpactLevel,
  };
  const simulatedEmissions = {
    ...simulatedCategoryEmissions,
    totalEmission: simulatedPrediction?.carbon_footprint_kg ?? simulatedCategoryEmissions.totalEmission,
    carbonImpactLevel: simulatedPrediction?.carbon_impact_level ?? simulatedCategoryEmissions.carbonImpactLevel,
  };

  useEffect(() => {
    if (isLoading) return;

    const controller = new AbortController();

    async function predictScenario(input: typeof baselineInputs) {
      const res = await fetch("/api/ml/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: buildMlFeatureVector(input),
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Prediction failed");
      }
      return data as MlPrediction;
    }

    async function loadPredictions() {
      try {
        const [baseline, simulated] = await Promise.all([
          predictScenario(baselineInputs),
          predictScenario(simulatedInputs),
        ]);
        setBaselinePrediction(baseline);
        setSimulatedPrediction(simulated);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Simulator prediction error:", err);
        }
      }
    }

    loadPredictions();

    return () => controller.abort();
  }, [
    isLoading,
    baselineInputs,
    simulatedInputs,
  ]);

  const dailySavings = Math.max(0, baselineEmissions.totalEmission - simulatedEmissions.totalEmission);
  const annualSavings = dailySavings * 365;

  const treesPlanted = annualSavings / 20;
  const phoneCharges = annualSavings / 0.0083;
  const bulbHours = annualSavings / 0.06;

  // Recharts Chart Data
  const chartData = [
    {
      name: "Transport",
      Baseline: baselineEmissions.transportEmission,
      Simulated: simulatedEmissions.transportEmission,
    },
    {
      name: "Energy",
      Baseline: baselineEmissions.electricityEmission,
      Simulated: simulatedEmissions.electricityEmission,
    },
    {
      name: "Food",
      Baseline: baselineEmissions.foodEmission,
      Simulated: simulatedEmissions.foodEmission,
    },
    {
      name: "Shopping/Waste",
      Baseline: Number((baselineEmissions.wasteEmission + baselineEmissions.shoppingEmission).toFixed(2)),
      Simulated: Number((simulatedEmissions.wasteEmission + simulatedEmissions.shoppingEmission).toFixed(2)),
    },
    {
      name: "Total Emissions",
      Baseline: baselineEmissions.totalEmission,
      Simulated: simulatedEmissions.totalEmission,
    },
  ];

  const resetSimulation = () => {
    if (profile) {
      const p = profile;
      setSimDiet(p.dietType || "vegetarian");
      setSimCar(p.transportMode === "car" ? 25 : 0);
      setSimTransit(p.transportMode === "bus" ? 15 : p.transportMode === "train" ? 20 : 0);
      setSimAC(p.electricityUsage === "high" ? 8 : p.electricityUsage === "medium" ? 4 : 1);
      setSimElectricity(p.electricityUsage === "high" ? 18 : p.electricityUsage === "medium" ? 10 : 5);
      setSimShopping(1);
      setSimRenewable(0);
      setSimScreen(4);
      setSimWaste((p.familySize ?? 1) > 3 ? 0.9 : 0.5);
      setSimEcoActions(1);
      toast.success("Simulation parameters reset to your profile baseline!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#dcecf3] p-6 rounded-2xl shadow-sm select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#08171e] flex items-center gap-2">
            <Cpu className="size-6 text-[#096b90]" />
            Carbon Footprint Simulator
          </h1>
          <p className="text-sm text-[#4d6673] mt-1 font-semibold">
            Experiment with lifestyle changes to see predicted savings and equivalents.
          </p>
        </div>
        <Button
          onClick={resetSimulation}
          className="bg-white border border-[#dcecf3] text-[#4d6673] hover:border-[#096b90] hover:text-[#08171e] flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg cursor-pointer font-bold shadow-sm"
          disabled={isLoading || !profile}
        >
          <RefreshCw className="size-3.5" /> Reset to Baseline
        </Button>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#096b90]" />
          <span className="text-sm text-[#4d6673] font-semibold">Calibrating simulation baseline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Sliders */}
          <div className="lg:col-span-1 bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm select-none space-y-6">
            <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider pb-2 border-b border-[#dcecf3]">
              Simulation Inputs
            </h3>

            {/* Daily Car Commute */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Daily Car Distance</span>
                <span className="text-[#08171e]">{simCar} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={simCar}
                onChange={(e) => setSimCar(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
              <span className="text-[10px] text-[#4d6673] block font-medium">Simulates commuting alone in a fossil fuel car.</span>
            </div>

            {/* Daily Public Transit */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Daily Public Transit</span>
                <span className="text-[#08171e]">{simTransit} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={simTransit}
                onChange={(e) => setSimTransit(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
              <span className="text-[10px] text-[#4d6673] block font-medium">Simulates taking bus or train.</span>
            </div>

            {/* AC usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Air Conditioner Runtime</span>
                <span className="text-[#08171e]">{simAC} hours/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={simAC}
                onChange={(e) => setSimAC(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
              <span className="text-[10px] text-[#4d6673] block font-medium">AC is heavy load. Minimizing saves major home emissions.</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Daily Electricity</span>
                <span className="text-[#08171e]">{simElectricity} kWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={simElectricity}
                onChange={(e) => setSimElectricity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
              <span className="text-[10px] text-[#4d6673] block font-medium">Household use excluding the AC runtime above.</span>
            </div>

            {/* Diet */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#4d6673] mb-2">Dietary Choice</label>
              <select
                value={simDiet}
                onChange={(e) => setSimDiet(e.target.value)}
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-lg py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-[#096b90]"
              >
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="meat-heavy">Meat-Heavy</option>
              </select>
              <span className="text-[10px] text-[#4d6673] block font-medium">Matches the food categories learned from the dataset.</span>
            </div>

            {/* Shopping */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Goods Purchases</span>
                <span className="text-[#08171e]">{simShopping} items/week</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={simShopping}
                onChange={(e) => setSimShopping(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
              <span className="text-[10px] text-[#4d6673] block font-medium">Included as a daily consumption signal for the model.</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Renewable Energy</span>
                <span className="text-[#08171e]">{simRenewable}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={simRenewable}
                onChange={(e) => setSimRenewable(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Screen Time</span>
                <span className="text-[#08171e]">{simScreen} hours/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={simScreen}
                onChange={(e) => setSimScreen(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Waste Generated</span>
                <span className="text-[#08171e]">{simWaste.toFixed(1)} kg/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={simWaste}
                onChange={(e) => setSimWaste(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#4d6673]">Eco Actions</span>
                <span className="text-[#08171e]">{simEcoActions}/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={simEcoActions}
                onChange={(e) => setSimEcoActions(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-[#096b90]"
              />
            </div>
          </div>

          {/* Graphical comparison & Equivalents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Emissions Comparison Chart */}
            <div className="bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider mb-4 pb-2 border-b border-[#dcecf3] select-none">
                Baseline vs. Simulated Emissions (kg CO2e)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#4d6673" />
                    <YAxis stroke="#4d6673" />
                    <Tooltip
                      contentStyle={ {
                        backgroundColor: "#ffffff",
                        borderColor: "#dcecf3",
                        borderRadius: "8px",
                        color: "#08171e",
                      } }
                    />
                    <Legend />
                    <Bar dataKey="Baseline" fill="#042b44" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Simulated" fill="#096b90" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Savings & Offset Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Savings */}
              <div className="bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm text-center flex flex-col justify-center items-center space-y-2 select-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Daily Carbon Saved
                </span>
                <p className="text-3xl font-extrabold text-[#08171e]">
                  {dailySavings.toFixed(2)} <span className="text-sm text-[#4d6673] font-bold">kg</span>
                </p>
                <span className="text-[10px] text-[#4d6673] font-medium">Compared to baseline profile</span>
              </div>

              {/* Annualized Savings */}
              <div className="bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm text-center flex flex-col justify-center items-center space-y-2 select-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Annual Savings Projected
                </span>
                <p className="text-3xl font-extrabold text-[#08171e]">
                  {annualSavings.toFixed(0)} <span className="text-sm text-[#4d6673] font-bold">kg</span>
                </p>
                <span className="text-[10px] text-[#4d6673] font-medium">If maintained for 1 year</span>
              </div>

              {/* Trees equivalent */}
              <div className="bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm text-center flex flex-col justify-center items-center space-y-2 select-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Annual Tree Equivalent
                </span>
                <p className="text-3xl font-extrabold text-[#042b44] flex items-center gap-1.5 justify-center">
                  <Trees className="size-6 text-emerald-600" />
                  {treesPlanted.toFixed(1)}
                </p>
                <span className="text-[10px] text-[#4d6673] font-medium">Mature trees planted equivalent</span>
              </div>
            </div>

            {/* Other equivalents */}
            <div className="bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6 select-none">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#096b90]/10 border border-[#dcecf3] rounded-xl text-[#096b90] shrink-0">
                  <Smartphone className="size-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#08171e] uppercase tracking-wider">Smartphone charges</h4>
                  <p className="text-xl font-extrabold text-[#042b44] mt-1">
                    {phoneCharges.toLocaleString(undefined, { maximumFractionDigits: 0 })} Charges
                  </p>
                  <p className="text-[10.5px] text-[#4d6673] mt-0.5 leading-normal font-medium">
                    The amount of emissions saved equals charging a smartphone this many times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#096b90]/10 border border-[#dcecf3] rounded-xl text-[#096b90] shrink-0">
                  <Zap className="size-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#08171e] uppercase tracking-wider">LED bulb runtime</h4>
                  <p className="text-xl font-extrabold text-[#042b44] mt-1">
                    {bulbHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} Hours
                  </p>
                  <p className="text-[10.5px] text-[#4d6673] mt-0.5 leading-normal font-medium">
                    The saved carbon translates to leaving a standard household bulb running for this duration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
