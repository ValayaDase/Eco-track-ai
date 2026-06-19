"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  Zap,
  Activity as ActivityIcon,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  CalendarRange,
  Leaf,
  BrainCircuit,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#10b981", "#06b6d4", "#0284c7", "#a1ccdc", "#4d6673"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // Fetch challenges (user XP, streak, badges)
        const chalRes = await fetch("/api/challenges");
        const chalData = chalRes.ok ? await chalRes.json() : null;

        // Fetch dashboard statistics (real user metrics & AI forecasts)
        const statsRes = await fetch("/api/dashboard/stats");
        const statsData = statsRes.ok ? await statsRes.json() : null;

        setData({
          user: chalData,
          stats: statsData,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalCarbon = data?.stats?.totalCarbon || 0.0;
  const todayCarbon = data?.stats?.todayCarbon || 0.0;
  const reductionPercent = data?.stats?.reductionPercent || 0.0;
  const recentActivities = data?.stats?.recentActivities || [];
  const trendData = data?.stats?.trendChartData || [];
  const segment = data?.stats?.segment;

  const getGreenLevel = (points: number) => {
    if (points < 100) return "Eco Novice";
    if (points < 250) return "Green Scout";
    if (points < 500) return "Carbon Crusader";
    return "Earth Guardian";
  };

  // Chart 1: Category Distribution
  const pieData = data?.stats?.todayEmissions
    ? [
        { name: "Transport", value: data.stats.todayEmissions.transportEmission },
        { name: "Utilities", value: data.stats.todayEmissions.electricityEmission },
        { name: "Diet", value: data.stats.todayEmissions.foodEmission },
        { name: "Waste", value: data.stats.todayEmissions.wasteEmission },
        { name: "Shopping", value: data.stats.todayEmissions.shoppingEmission },
      ].filter((item) => item.value > 0)
    : [];

  const displayPieData = pieData.length > 0 ? pieData : [{ name: "No emissions logged", value: 1 }];

  // Compute average of last 7 logged days
  const validEmissions = trendData.filter((d: any) => d.Emissions !== null).map((d: any) => d.Emissions);
  const avgWeeklyEmissions = validEmissions.length > 0
    ? Number((validEmissions.reduce((sum: number, v: number) => sum + v, 0) / validEmissions.length).toFixed(1))
    : 14.5;

  // Chart 3: Comparisons
  const comparisonData = [
    { name: "My Today", CO2: todayCarbon },
    { name: "My 7d Avg", CO2: avgWeeklyEmissions },
    { name: "City Average", CO2: 24.5 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="space-y-6">
      {/* Header section with Glassmorphic welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#08171e] flex items-center gap-2">
            <BrainCircuit className="size-6 text-emerald-600 animate-pulse" />
            AI Climate-Tech Control Panel
          </h1>
          
        </div>
        
        
      </motion.div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <span className="text-sm text-muted-foreground font-semibold">Tuning neural forecasting nodes...</span>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Overview Cards Row */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-6 select-none">
            {/* Lifetime carbon */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Total Carbon</span>
                <p className="text-2xl font-black text-[#08171e] mt-1.5">{totalCarbon} kg</p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block font-semibold">Lifetime recorded CO2e</span>
            </motion.div>

            {/* Today carbon */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Today's Emissions</span>
                <p className="text-2xl font-black text-[#08171e] mt-1.5">{todayCarbon} kg</p>
              </div>
              <span className="text-[10px] text-emerald-600 mt-2 block flex items-center gap-0.5 font-bold">
                <TrendingDown className="size-3" /> Real emissions data
              </span>
            </motion.div>

            {/* Weekly reduction */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-cyan-500" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Weekly Shift</span>
                <p className={`text-2xl font-black mt-1.5 ${reductionPercent >= 0 ? "text-[#08171e]" : "text-rose-600"}`}>
                  {reductionPercent >= 0 ? `-${reductionPercent}%` : `+${Math.abs(reductionPercent)}%`}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block font-semibold">
                {reductionPercent >= 0 ? "Reduction vs last week" : "Increase vs last week"}
              </span>
            </motion.div>

            {/* Green score */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-amber-500" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Green Badge</span>
                <p className="text-base font-black text-[#08171e] mt-1.5 truncate">
                  {getGreenLevel(data?.user?.points || 0)}
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 mt-2 block font-bold">
                {data?.user?.points || 0} XP Earned
              </span>
            </motion.div>

            {/* Streak */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-orange-500" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Active Streak</span>
                <p className="text-2xl font-black text-[#08171e] mt-1.5 flex items-center gap-1">
                  <Flame className="size-5 text-orange-500 fill-current" />
                  {data?.user?.streak || 0} Days
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 block font-semibold">Daily check-in streak</span>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
            {/* Category breakdown (Pie) */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Leaf className="size-4 text-emerald-600" />
                Emissions Breakdown
              </h3>
              <div className="h-56 w-full relative flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#042b44",
                          borderColor: "rgba(16, 185, 129, 0.3)",
                          borderRadius: "12px",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <Info className="size-8 text-muted-foreground mb-1.5" />
                    <span className="text-xs text-muted-foreground font-semibold">
                      No emissions recorded today. Fill out your Daily Tracker!
                    </span>
                  </div>
                )}

                {/* Pie chart center info label */}
                {pieData.length > 0 && (
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Today</span>
                    <span className="text-lg font-black text-[#08171e]">{todayCarbon.toFixed(1)} kg</span>
                  </div>
                )}
              </div>

              {/* Legend custom chips list */}
              {pieData.length > 0 && (
                <div className="flex flex-wrap gap-2.5 justify-center mt-2 text-[10px] font-bold uppercase text-muted-foreground">
                  {pieData.map((item, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Historical Trend vs. Forecast (Line) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="size-4 text-cyan-600" />
                  AI Historical Emissions & Forecast
                </h3>
              </div>
              
              <div className="h-64 w-full text-[10px] font-bold">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                      <XAxis dataKey="displayDate" stroke="#4d6673" />
                      <YAxis stroke="#4d6673" label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fill: '#4d6673' } }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(4, 43, 68, 0.95)",
                          borderColor: "rgba(6, 182, 212, 0.4)",
                          borderRadius: "12px",
                          color: "white",
                          fontSize: "11px",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="plainline" />
                      
                      {/* Historical actual emission line */}
                      <Line
                        name="Historical Actuals"
                        type="monotone"
                        dataKey="Emissions"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />

                      {/* Forecast emission line */}
                      <Line
                        name="AI Forecast Projection"
                        type="monotone"
                        dataKey="Forecast"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        dot={{ r: 3, stroke: "#06b6d4", strokeWidth: 1, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom Grid: Comparisons + Activities + Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Comparisons (Bar) */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider mb-4">
                Comparison Footprint
              </h3>
              <div className="h-56 w-full text-[10px] font-bold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                    <XAxis dataKey="name" stroke="#4d6673" />
                    <YAxis stroke="#4d6673" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#042b44",
                        borderColor: "rgba(9, 107, 144, 0.3)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="CO2" fill="#0284c7" radius={[6, 6, 0, 0]}>
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#10b981" : index === 1 ? "#06b6d4" : "#4d6673"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Actions & Recent logs Column */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center pb-3 border-b border-border/40 mb-4 select-none">
                <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider">
                  Recent Daily Audits
                </h3>
                <Link href="/tracker" className="text-xs font-bold text-cyan-600 hover:underline">
                  View Tracker
                </Link>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-semibold">
                  No records logged yet. Begin by tracking your activities.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((act: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <ActivityIcon className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[#08171e]">{act.category}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(act.date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#08171e] font-black">{act.co2.toFixed(1)} kg CO2</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Personalized Lifestyle Segment Nudges */}
            <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none">
                  <Sparkles className="size-4 text-cyan-600 animate-pulse" />
                  AI Segment Insights
                </h3>

                {segment ? (
                  <div className="space-y-4">
                    <div className="bg-[#f0f7fa] border border-[#dcecf3] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${segment.badgeColor}`}>
                          {segment.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                        {segment.description}
                      </p>
                    </div>
                    
                    <div className="text-[10.5px] text-muted-foreground leading-normal font-semibold italic bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                      💡 Tip: Head to the AI Recommendations page to inspect personalized nudges compiled dynamically for your lifestyle class!
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-8 text-center select-none font-semibold">
                    Complete at least 3 daily audits to map your carbon lifestyle segment!
                  </div>
                )}
              </div>

              <Link href="/recommendations" className="block mt-4 text-center select-none">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-extrabold text-xs py-2.5 rounded-xl border-none shadow-sm cursor-pointer transition-all duration-300">
                  See All AI Insights
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
