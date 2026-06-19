"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Leaf,
  Car,
  Zap,
  Utensils,
  Recycle,
  ShoppingBag,
  Loader2,
  HelpCircle,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { RecommendationAIResult } from "@/lib/gemini";

const CATEGORY_MAP = {
  transport: { label: "Transportation", icon: Car, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  energy: { label: "Home Utilities", icon: Zap, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  food: { label: "Food & Diet", icon: Utensils, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  waste: { label: "Waste & Recycling", icon: Recycle, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  shopping: { label: "Consumer Goods", icon: ShoppingBag, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
};

const PRIORITY_COLOR = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const DIFFICULTY_COLOR = {
  easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationAIResult[]>([]);
  const [segment, setSegment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    async function loadRecommendations() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/recommendations");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        if (data.segment) {
          setSegment(data.segment);
        }
      } catch (err) {
        toast.error("Failed to load AI suggestions. Displaying offline recommendations.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRecommendations();
  }, []);

  const filteredRecs = filterCategory === "all"
    ? recommendations
    : recommendations.filter((r) => r.category === filterCategory);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#08171e] flex items-center gap-2">
            <Sparkles className="size-6 text-emerald-600 animate-pulse" />
            AI-Powered Green Recommendations
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Tailored carbon reduction nudges generated dynamically by analyzing your profile and lifestyle segment.
          </p>
        </div>

        {/* Categories selector */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-[#dcecf3] rounded-xl py-1.5 px-3 text-xs text-[#08171e] focus:outline-none focus:border-emerald-500 self-start md:self-center font-bold"
        >
          <option value="all">All Categories</option>
          <option value="transport">Transportation</option>
          <option value="energy">Home Energy</option>
          <option value="food">Diet & Food</option>
          <option value="waste">Plastic & Waste</option>
          <option value="shopping">Shopping Habits</option>
        </select>
      </div>

      {/* Dynamic Segment Description */}
      {segment && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
          <BrainCircuit className="size-6 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground font-extrabold">
                Your AI Carbon Segment
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${segment.badgeColor}`}>
                {segment.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              {segment.description}
            </p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <span className="text-sm text-muted-foreground font-semibold">Consulting AI advisor...</span>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground font-bold">
          No recommendations found for the selected category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecs.map((rec, index) => {
            const catInfo = CATEGORY_MAP[rec.category as keyof typeof CATEGORY_MAP] || {
              label: rec.category,
              icon: HelpCircle,
              color: "text-gray-600 bg-gray-500/10 border-gray-500/20",
            };
            const CatIcon = catInfo.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="glass-panel hover:border-emerald-600/30 rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill and Top Row */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${catInfo.color}`}>
                      <CatIcon className="size-3.5" />
                      {catInfo.label}
                    </span>

                    {/* Projected CO2 offset */}
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground font-bold block uppercase tracking-wider">Est. Monthly Savings</span>
                      <span className="text-sm font-black text-emerald-600">{rec.estimatedSavings} kg CO2e</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-[#08171e] leading-snug mb-2">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-6">{rec.description}</p>
                </div>

                {/* Priority / Difficulty labels */}
                <div className="flex items-center gap-2.5 pt-4 border-t border-[#dcecf3]/70 text-[10px] font-bold uppercase tracking-wider">
                  <span className={`px-2.5 py-0.5 rounded border ${PRIORITY_COLOR[rec.priority as keyof typeof PRIORITY_COLOR]}`}>
                    Priority: {rec.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded border ${DIFFICULTY_COLOR[rec.difficulty as keyof typeof DIFFICULTY_COLOR]}`}>
                    Difficulty: {rec.difficulty}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
