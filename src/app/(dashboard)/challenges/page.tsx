"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Flame, Award, ShieldAlert, Check, Recycle, Bus, CalendarCheck, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ICON_MAP = {
  Recycle: Recycle,
  Bus: Bus,
  ZapOff: Zap,
  CalendarCheck: CalendarCheck,
  ShieldAlert: ShieldAlert,
};

export default function ChallengesPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Load challenges and user stats
  const fetchChallengesData = async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      toast.error("Failed to load eco challenges.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesData();
  }, []);

  const handleCompleteChallenge = async (challengeId: string) => {
    setCompletingId(challengeId);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to complete challenge");
      }

      toast.success(`Completed! +${json.pointsEarned} Green XP`);
      
      if (json.newBadges && json.newBadges.length > 0) {
        json.newBadges.forEach((badge: any) => {
          toast.success(`🎉 Milestone Unlocked: "${badge.title}" badge earned!`);
        });
      }

      fetchChallengesData();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setCompletingId(null);
    }
  };

  const getGreenLevel = (points: number) => {
    if (points < 100) return { title: "Eco Novice", color: "text-amber-600" };
    if (points < 250) return { title: "Green Scout", color: "text-blue-600" };
    if (points < 500) return { title: "Carbon Crusader", color: "text-[#096b90]" };
    return { title: "Earth Guardian", color: "text-emerald-600 font-extrabold" };
  };

  const levelInfo = data ? getGreenLevel(data.points) : { title: "Eco Novice", color: "text-amber-600" };

  return (
    <div className="space-y-6 select-none">
      {/* Overview Cards Row */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level Progress */}
          <div className="bg-white border border-[#dcecf3] p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[5px] bg-[#096b90]" />
            <div className="size-12 rounded-xl bg-[#096b90]/10 border border-[#dcecf3] flex items-center justify-center text-[#096b90]">
              <Trophy className="size-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#4d6673] font-bold block uppercase tracking-wider">Green Level Status</span>
              <span className={`text-base font-bold tracking-wide ${levelInfo.color}`}>
                {levelInfo.title}
              </span>
              <p className="text-[11px] text-[#4d6673] mt-0.5 font-medium">{data.points} total Green XP</p>
            </div>
          </div>

          {/* XP Score */}
          <div className="bg-white border border-[#dcecf3] p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[5px] bg-emerald-600" />
            <div className="size-12 rounded-xl bg-emerald-500/10 border border-[#dcecf3] flex items-center justify-center text-emerald-600">
              <Star className="size-6" />
            </div>
            <div>
              <span className="text-[10px] text-[#4d6673] font-bold block uppercase tracking-wider">Total Balance</span>
              <span className="text-xl font-extrabold text-[#08171e]">{data.points} XP</span>
              <p className="text-[11px] text-[#4d6673] mt-0.5 font-medium">Use points to unlock badges</p>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="bg-white border border-[#dcecf3] p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[5px] bg-amber-500" />
            <div className="size-12 rounded-xl bg-amber-500/10 border border-[#dcecf3] flex items-center justify-center text-amber-500">
              <Flame className="size-6 fill-current animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] text-[#4d6673] font-bold block uppercase tracking-wider">Activity Streak</span>
              <span className="text-xl font-extrabold text-[#08171e]">{data.streak} Days</span>
              <p className="text-[11px] text-[#4d6673] mt-0.5 font-medium">Log activity daily to grow streak</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#096b90]" />
          <span className="text-sm text-[#4d6673] font-semibold">Loading daily challenges feed...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenges List */}
          <div className="lg:col-span-2 bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#08171e] pb-2 border-b border-[#dcecf3] flex items-center gap-2 uppercase tracking-wider">
              <Zap className="size-4.5 text-[#096b90]" />
              Daily Sustainability Tasks
            </h2>

            <div className="space-y-3">
              {data?.challenges.map((challenge: any) => (
                <div
                  key={challenge.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    challenge.completed
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                      : "bg-[#f7fbfd] border-[#dcecf3] hover:border-[#096b90]/30 text-[#4d6673]"
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs font-bold text-[#08171e]">{challenge.title}</h4>
                    <p className="text-[11px] text-[#4d6673] leading-normal font-semibold">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-[#096b90]">+{challenge.points} XP</span>
                    {challenge.completed ? (
                      <span className="size-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                        <Check className="size-4 stroke-[3px]" />
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        className="bg-[#042b44] hover:bg-[#096b90] text-white text-[10.5px] font-bold py-1 px-3 rounded-md cursor-pointer border-none shadow-sm"
                        disabled={completingId !== null}
                      >
                        {completingId === challenge.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Complete"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unlocked Badges side view */}
          <div className="lg:col-span-1 bg-white border border-[#dcecf3] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#08171e] pb-2 border-b border-[#dcecf3] flex items-center gap-2 uppercase tracking-wider">
              <Award className="size-4.5 text-[#096b90]" />
              Achievement Badges
            </h2>

            {data?.badges.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#4d6673] font-semibold">
                No badges unlocked yet. Complete daily tasks and log activity to unlock milestones!
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                {data?.badges.map((badgeId: string) => {
                  const badgeDetails = [
                    { id: "recycling-champion", title: "Recycling Champion", desc: "Log <= 1 plastics for 3 separate days.", icon: "Recycle" },
                    { id: "public-transport-hero", title: "Public Transport Hero", desc: "Travel > 50km on bus/train commutes.", icon: "Bus" },
                    { id: "energy-saver", title: "Energy Saver", desc: "Keep daily electricity usage under 10 units.", icon: "ZapOff" },
                    { id: "green-week-winner", title: "Green Week Winner", desc: "Maintain a 7-day carbon logging streak.", icon: "CalendarCheck" },
                    { id: "earth-guardian", title: "Earth Guardian", desc: "Accumulate at least 500 Green XP.", icon: "ShieldAlert" },
                  ].find((b) => b.id === badgeId);

                  if (!badgeDetails) return null;

                  const BadgeIcon = ICON_MAP[badgeDetails.icon as keyof typeof ICON_MAP] || Award;

                  return (
                    <motion.div
                      key={badgeId}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-start gap-3.5 bg-[#f7fbfd] border border-[#dcecf3] rounded-xl p-3.5"
                    >
                      <div className="size-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <BadgeIcon className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#08171e]">{badgeDetails.title}</h4>
                        <p className="text-[10px] text-[#4d6673] mt-0.5 leading-normal font-semibold">
                          {badgeDetails.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
