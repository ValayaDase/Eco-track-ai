"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal, Trophy, Flame, Award, Users, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast.error("Failed to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const top3 = data?.leaderboard ? data.leaderboard.slice(0, 3) : [];
  const restUsers = data?.leaderboard ? data.leaderboard.slice(3) : [];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Medal className="size-6 text-accent-blue" />
            Global Green Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track how you rank against other Eco-Track users in sustainability score achievements.
          </p>
        </div>

        {/* Current user rank overview */}
        {data && (
          <div className="bg-primary-dark/65 border border-border rounded-xl p-3 flex items-center gap-4 text-xs font-bold text-light-accent self-start md:self-center">
            <div className="flex items-center gap-1">
              <Trophy className="size-4 text-accent-blue" />
              <span>Rank #{data.userRank}</span>
            </div>
            <div className="flex items-center gap-1 border-l border-border/60 pl-4">
              <Star className="size-4 text-emerald-400" />
              <span>{data.userPoints} XP</span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-accent-blue" />
          <span className="text-sm text-muted-foreground font-semibold">Tuning ranking statistics...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium Layout */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-6 max-w-3xl mx-auto">
              {/* Second Place (Podium left) */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 order-2 sm:order-1 relative"
                >
                  <span className="absolute -top-3.5 size-7 rounded-full bg-slate-400 text-primary-dark font-extrabold flex items-center justify-center border border-white text-xs">
                    2
                  </span>
                  <div className="size-11 rounded-full bg-slate-400/10 border border-slate-400/30 flex items-center justify-center text-slate-300 font-extrabold text-sm">
                    {top3[1].name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[130px]">{top3[1].name}</h4>
                    <p className="text-xs text-slate-300 mt-1 font-bold">{top3[1].points} XP</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-medium">
                    <Flame className="size-3 text-amber-500 fill-current" />
                    <span>{top3[1].streak} day streak</span>
                  </div>
                </motion.div>
              )}

              {/* First Place (Podium Center - Larger) */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-accent-blue/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 order-1 sm:order-2 shadow-xl relative scale-100 sm:scale-105"
                >
                  <span className="absolute -top-4.5 size-9 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 text-primary-dark font-extrabold flex items-center justify-center border-2 border-white text-sm shadow">
                    1
                  </span>
                  <div className="size-14 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-extrabold text-base">
                    {top3[0].name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white truncate max-w-[150px]">{top3[0].name}</h4>
                    <p className="text-sm text-accent-blue mt-1.5 font-black">{top3[0].points} XP</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-light-accent font-semibold">
                    <Flame className="size-3.5 text-amber-500 fill-current animate-pulse" />
                    <span>{top3[0].streak} day streak</span>
                  </div>
                </motion.div>
              )}

              {/* Third Place (Podium right) */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 order-3 relative"
                >
                  <span className="absolute -top-3.5 size-7 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center border border-white text-xs">
                    3
                  </span>
                  <div className="size-11 rounded-full bg-amber-700/10 border border-amber-700/30 flex items-center justify-center text-amber-600 font-extrabold text-sm">
                    {top3[2].name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[130px]">{top3[2].name}</h4>
                    <p className="text-xs text-amber-600 mt-1 font-bold">{top3[2].points} XP</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-medium">
                    <Flame className="size-3 text-amber-500 fill-current" />
                    <span>{top3[2].streak} day streak</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Rankings Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-md">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Users className="size-4.5 text-accent-blue" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Competitors</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-primary-dark/35 border-b border-border/50 text-light-accent/65 font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 text-center">Rank</th>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Green Points</th>
                    <th className="py-3 px-5">Active Streak</th>
                    <th className="py-3 px-5 text-center">Badges Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-light-accent font-medium">
                  {data?.leaderboard.map((u: any) => {
                    const isSelf = u.id === data.leaderboard[u.rank - 1]?.id; // simple check
                    // Let's check user session ID if matches u.id
                    // Wait, we can match and highlight the user row
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-primary-blue/20 transition-colors ${
                          u.rank <= 3 ? "font-bold text-white" : ""
                        }`}
                      >
                        <td className="py-3.5 px-5 text-center font-bold text-light-accent/70">
                          #{u.rank}
                        </td>
                        <td className="py-3.5 px-5 flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-secondary-blue/30 border border-secondary-blue/50 flex items-center justify-center font-bold text-[11px] text-white">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 px-5 text-white font-extrabold">{u.points} XP</td>
                        <td className="py-3.5 px-5">
                          <span className="flex items-center gap-1">
                            <Flame className="size-3.5 text-amber-500 fill-current" />
                            {u.streak} Days
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-accent-blue/10 border border-accent-blue/20 text-accent-blue font-bold text-[10.5px]">
                            <Award className="size-3" /> {u.badgesCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
