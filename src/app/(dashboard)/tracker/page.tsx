"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  Car,
  Zap,
  Leaf,
  Loader2,
  CheckCircle,
  AlertCircle,
  Footprints,
  Info,
} from "lucide-react";
import { getLocalDateString, formatFriendlyDate } from "@/lib/helpers";
import { calculateCategoryEmissions } from "@/lib/calculations";
import { useDebounce } from "@/hooks/useDebounce";

// Import LeafletMap dynamically with SSR disabled to prevent window is not defined error
const LeafletMap = dynamic(() => import("@/components/tracker/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] bg-white border border-[#dcecf3] animate-pulse rounded-xl flex flex-col items-center justify-center gap-3 text-xs text-[#4d6673]">
      <Loader2 className="size-6 animate-spin text-emerald-600" />
      <span>Initializing Interactive GPS telemetry map...</span>
    </div>
  ),
});

const createEmptyForm = (foodType = "vegetarian") => ({
  walkingDistance: 0,
  cyclingDistance: 0,
  bikeDistance: 0,
  carDistance: 0,
  busDistance: 0,
  trainDistance: 0,
  electricityUnits: 0,
  acHours: 0,
  foodType,
  plasticUsage: 0,
  shoppingCount: 0,
  renewableUsagePct: 0,
  screenTimeHours: 0,
  wasteGeneratedKg: 0,
  ecoActions: 0,
});

function serializeFormData(data: ReturnType<typeof createEmptyForm>) {
  return JSON.stringify(data);
}

export default function TrackerPage() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error" | "warn-pending">("saved");
  const [rollingStats, setRollingStats] = useState<{ mean: number; stdDev: number; count: number } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Local Form state
  const [formData, setFormData] = useState(createEmptyForm);
  const editVersion = useRef(0);
  const latestFormDataRef = useRef(formData);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  // Calculate a live, category-level estimate in the client.
  const liveEmissions = calculateCategoryEmissions({ ...formData, date: selectedDate });

  // Calculate live Z-score based on rollingStats
  const liveZScore = (() => {
    if (!rollingStats || rollingStats.count < 3 || rollingStats.stdDev === 0) return 0;
    return (liveEmissions.totalEmission - rollingStats.mean) / rollingStats.stdDev;
  })();

  const isAnomalous = liveZScore > 2.5;

  // Load activity for chosen date
  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setIsConfirmed(false); // Reset confirmation on date change
      setIsDirty(false);
      editVersion.current += 1;
      try {
        const res = await fetch(`/api/activities?date=${selectedDate}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load records");

        const data = await res.json();
        
        if (data.rollingStats) {
          setRollingStats(data.rollingStats);
        }

        if (data.activity) {
          setFormData({
            walkingDistance: data.activity.walkingDistance ?? 0,
            cyclingDistance: data.activity.cyclingDistance ?? 0,
            bikeDistance: data.activity.bikeDistance ?? 0,
            carDistance: data.activity.carDistance ?? 0,
            busDistance: data.activity.busDistance ?? 0,
            trainDistance: data.activity.trainDistance ?? 0,
            electricityUnits: data.activity.electricityUnits ?? 0,
            acHours: data.activity.acHours ?? 0,
            foodType: data.activity.foodType || data.defaults?.foodType || "vegetarian",
            plasticUsage: data.activity.plasticUsage ?? 0,
            shoppingCount: data.activity.shoppingCount ?? 0,
            renewableUsagePct: data.activity.renewableUsagePct ?? 0,
            screenTimeHours: data.activity.screenTimeHours ?? 0,
            wasteGeneratedKg: data.activity.wasteGeneratedKg ?? 0,
            ecoActions: data.activity.ecoActions ?? 0,
          });
        } else {
          setFormData(createEmptyForm(data.defaults?.foodType));
        }
        setSaveStatus("saved");
      } catch (err) {
        toast.error("Error loading activity data for this date.");
      } finally {
        setIsLoading(false);
      }
    }
    loadActivity();
  }, [selectedDate]);

  // Debounce form data to auto-save in database
  const debouncedFormData = useDebounce(formData, 1500);

  // Save activity callback
  const saveActivity = useCallback(
    async (dataToSave: typeof formData, confirmSave = false, savedVersion = editVersion.current) => {
      const runSave = async () => {
        setSaveStatus("saving");
        try {
          const res = await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: selectedDate,
              confirmed: confirmSave,
              ...dataToSave,
            }),
          });

          const json = await res.json();
          
          if (!res.ok) {
            if (json.requiresConfirmation) {
              setSaveStatus("warn-pending");
              return "warn-pending";
            }
            throw new Error(json.error || "Failed to auto-save");
          }

          setSaveStatus("saved");
          if (savedVersion === editVersion.current) {
            setIsDirty(false);
          }
          return "saved";
        } catch (err: unknown) {
          setSaveStatus("error");
          console.error("Auto-save error:", err);
          return "error";
        }
      };

      const queuedSave = saveQueueRef.current.then(runSave, runSave);
      saveQueueRef.current = queuedSave.then(
        () => undefined,
        () => undefined
      );
      return queuedSave;
    },
    [selectedDate]
  );

  // Trigger auto-save whenever debounced form state changes (skip initial render load)
  useEffect(() => {
    if (isLoading || !isDirty) return;
    if (serializeFormData(debouncedFormData) !== serializeFormData(latestFormDataRef.current)) return;

    // Check if debounced state is anomalous
    const debouncedEmissions = calculateCategoryEmissions({ ...debouncedFormData, date: selectedDate });
    const z = (!rollingStats || rollingStats.count < 3 || rollingStats.stdDev === 0)
      ? 0
      : (debouncedEmissions.totalEmission - rollingStats.mean) / rollingStats.stdDev;

    const debouncedAnomalous = z > 2.5;

    if (debouncedAnomalous && !isConfirmed) {
      setSaveStatus("warn-pending");
      return;
    }

    saveActivity(debouncedFormData, isConfirmed, editVersion.current);
  }, [debouncedFormData, saveActivity, isLoading, isDirty, isConfirmed, rollingStats, selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSaveStatus("unsaved");
    setIsDirty(true);
    editVersion.current += 1;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "foodType" ? value : Math.max(0, parseFloat(value) || 0),
    }));
  };

  // Distance applied from Leaflet map selection
  const handleApplyRoute = async (distanceKm: number, transportMode: string) => {
    setSaveStatus("unsaved");
    setIsDirty(true);
    editVersion.current += 1;
    const fieldMap: Record<string, string> = {
      walking: "walkingDistance",
      cycling: "cyclingDistance",
      car: "carDistance",
      bus: "busDistance",
      train: "trainDistance",
      bike: "bikeDistance",
    };

    const targetFieldName = fieldMap[transportMode];
    if (targetFieldName) {
      const nextFormData = {
        ...formData,
        [targetFieldName]: Number(((formData[targetFieldName as keyof typeof formData] as number) + distanceKm).toFixed(2)),
      };

      setFormData(nextFormData);
      const routeSaveStatus = await saveActivity(nextFormData, isConfirmed, editVersion.current);

      if (routeSaveStatus === "saved") {
        toast.success(`Added ${distanceKm} km ${transportMode} route to your daily tracking record.`);
      } else if (routeSaveStatus === "warn-pending") {
        toast.warning("This route makes today's footprint unusually high. Confirm the entry to save it.");
      } else {
        toast.error("Could not add this route to your daily tracking record.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#08171e] flex items-center gap-2 select-none">
            <Footprints className="size-6 text-emerald-600 animate-bounce" />
            Daily Activity Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold select-none">
            Log your daily habits for a live category footprint estimate and personalized recommendations.
          </p>
        </div>

        {/* Date & Auto-save Status controller */}
        <div className="flex items-center gap-3 self-start md:self-center select-none">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground pointer-events-none">
              <Calendar className="size-4" />
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-[#dcecf3] rounded-xl py-1.5 pl-9 pr-3 text-xs text-[#08171e] focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          {/* Auto-Save Pill */}
          <div className="flex items-center font-bold">
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] bg-[#0284c7]/10 text-[#0284c7]">
                <Loader2 className="size-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="size-3" /> Saved
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] bg-amber-500/10 text-amber-600">
                <Info className="size-3" /> Pending Save
              </span>
            )}
            {saveStatus === "warn-pending" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] bg-rose-500/10 text-rose-600 animate-pulse">
                <AlertCircle className="size-3" /> Awaiting Confirm
              </span>
            )}
            {saveStatus === "error" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] bg-red-500/10 text-red-600">
                <AlertCircle className="size-3" /> Save Error
              </span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <span className="text-sm text-muted-foreground font-semibold">Loading tracker records...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Anomaly Detection Banner */}
            <AnimatePresence>
              {isAnomalous && !isConfirmed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl p-5 text-left flex items-start gap-3.5 shadow-sm"
                >
                  <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 select-none">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Data Quality Warning</h4>
                    <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                      Today&apos;s carbon footprint estimate ({liveEmissions.totalEmission} kg) is significantly higher than your rolling 7-day average of {rollingStats?.mean.toFixed(1)} kg. (Z-Score: {liveZScore.toFixed(2)}).
                    </p>
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer select-none bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/20 w-fit hover:bg-amber-500/20 transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        className="rounded border-amber-500/30 text-amber-600 focus:ring-amber-500 size-4 cursor-pointer"
                      />
                      Yes, I confirm this entry is correct. Save anyway.
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1. Transportation Log */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xs font-bold text-[#08171e] mb-4 flex items-center gap-2 pb-2 border-b border-[#dcecf3] uppercase tracking-wider select-none">
                <Car className="size-4 text-emerald-600" />
                Transportation Logs (km)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "walkingDistance", label: "Walk / Run" },
                  { name: "cyclingDistance", label: "Bicycle" },
                  { name: "bikeDistance", label: "Motorcycle" },
                  { name: "carDistance", label: "Personal Car" },
                  { name: "busDistance", label: "Public Bus" },
                  { name: "trainDistance", label: "Train / Subway" },
                ].map((item) => (
                  <div key={item.name}>
                    <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      name={item.name}
                      value={formData[item.name as keyof typeof formData] || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      min={0}
                      className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 2. Lifestyle & Home Log */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xs font-bold text-[#08171e] mb-4 flex items-center gap-2 pb-2 border-b border-[#dcecf3] uppercase tracking-wider select-none">
                <Zap className="size-4 text-emerald-600" />
                Home Energy & Consumption
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Electricity Units */}
                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Electricity (kWh/Units)
                  </label>
                  <input
                    type="number"
                    name="electricityUnits"
                    value={formData.electricityUnits || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* AC Usage */}
                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    AC Runtime (Hours)
                  </label>
                  <input
                    type="number"
                    name="acHours"
                    value={formData.acHours || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    max={24}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* Dietary Choice */}
                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Dietary preference
                  </label>
                  <select
                    name="foodType"
                    value={formData.foodType}
                    onChange={handleInputChange}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="meat-heavy">Meat-Heavy</option>
                  </select>
                </div>

                {/* Plastic Usage */}
                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Single-Use Plastics (Items)
                  </label>
                  <input
                    type="number"
                    name="plasticUsage"
                    value={formData.plasticUsage || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* Shopping Count */}
                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Goods Purchased (Items)
                  </label>
                  <input
                    type="number"
                    name="shoppingCount"
                    value={formData.shoppingCount || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Renewable Energy (%)
                  </label>
                  <input
                    type="number"
                    name="renewableUsagePct"
                    value={formData.renewableUsagePct || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    max={100}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Screen Time (Hours)
                  </label>
                  <input
                    type="number"
                    name="screenTimeHours"
                    value={formData.screenTimeHours || ""}
                    onChange={handleInputChange}
                    placeholder="4"
                    min={0}
                    max={24}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Waste Generated (kg)
                  </label>
                  <input
                    type="number"
                    name="wasteGeneratedKg"
                    value={formData.wasteGeneratedKg || ""}
                    onChange={handleInputChange}
                    placeholder="0.5"
                    min={0}
                    step="0.1"
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#4d6673] uppercase tracking-wider mb-2 select-none">
                    Eco Actions (Count)
                  </label>
                  <input
                    type="number"
                    name="ecoActions"
                    value={formData.ecoActions || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min={0}
                    className="w-full bg-white/50 border border-[#dcecf3] rounded-xl py-2 px-3 text-xs text-[#08171e] placeholder-muted-foreground/45 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>
            </motion.div>

            {/* 3. Map Integration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="z-0"
            >
              <LeafletMap onApplyRoute={handleApplyRoute} />
            </motion.div>
          </div>

          {/* Results Summary Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-6 shadow-sm text-center flex flex-col justify-between h-fit relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-emerald-500 to-cyan-500" />

              <div className="pt-2 select-none">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total daily emissions
                </span>
                <p className="text-4xl font-black text-[#08171e] mt-2 mb-1">
                  {liveEmissions.totalEmission} <span className="text-lg font-bold text-muted-foreground">kg</span>
                </p>
                <p className="text-xs text-muted-foreground font-semibold">
                  Logged for {formatFriendlyDate(selectedDate)} - {liveEmissions.carbonImpactLevel} impact
                </p>
              </div>

              {/* Category Footprint list */}
              <div className="space-y-4 my-8 text-left select-none">
                {[
                  { label: "Transportation", val: liveEmissions.transportEmission, color: "bg-emerald-600" },
                  { label: "Electricity, AC & Screens", val: liveEmissions.electricityEmission, color: "bg-cyan-600" },
                  { label: "Food Diet", val: liveEmissions.foodEmission, color: "bg-teal-500" },
                  { label: "Plastic Waste", val: liveEmissions.wasteEmission, color: "bg-sky-400" },
                  { label: "Goods Shopping", val: liveEmissions.shoppingEmission, color: "bg-muted-foreground" },
                ].map((item, idx) => {
                  const percent = liveEmissions.totalEmission > 0
                    ? (item.val / liveEmissions.totalEmission) * 100
                    : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-[#08171e]">{item.val} kg CO2e</span>
                      </div>
                      <div className="w-full bg-[#f7fbfd] border border-[#dcecf3] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Offset Equivalents Display */}
              <div className="bg-[#f0f7fa] border border-[#dcecf3] rounded-xl p-4 text-left space-y-3 select-none">
                <h4 className="text-xs font-bold text-[#08171e] flex items-center gap-1.5">
                  <Leaf className="size-3.5 text-emerald-600" /> Environment Equivalents
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Trees / Year</span>
                    <span className="text-emerald-600 font-black text-sm">
                      {(liveEmissions.totalEmission / 20).toFixed(2)} Trees
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Phone Charges</span>
                    <span className="text-cyan-600 font-black text-sm">
                      {(liveEmissions.totalEmission / 0.0083).toFixed(0)} Charges
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
