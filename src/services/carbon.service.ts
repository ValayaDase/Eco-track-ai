import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { DEFAULT_BADGES } from "@/constants/challenges";
import { getLocalDateString } from "@/lib/helpers";

/**
 * Checks a user's activities and points history to unlock badges.
 * Returns any newly unlocked badge objects.
 */
export async function checkAndUnlockBadges(userId: string): Promise<any[]> {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) return [];

  const userBadges = new Set<string>(user.badges || []);
  const newlyUnlocked: any[] = [];

  // Fetch user activities for assessment
  const activities = await Activity.find({ userId }).sort({ date: -1 });

  for (const badge of DEFAULT_BADGES) {
    if (userBadges.has(badge.id)) continue;

    let qualifies = false;

    if (badge.id === "recycling-champion") {
      // Log <= 1 plastic item for 3 separate days
      const lowPlasticDays = activities.filter((act) => act.plasticUsage <= 1).length;
      if (lowPlasticDays >= 3) {
        qualifies = true;
      }
    }

    if (badge.id === "public-transport-hero") {
      // Log > 50km total distance by bus/train
      const totalTransit = activities.reduce(
        (sum, act) => sum + (act.busDistance || 0) + (act.trainDistance || 0),
        0
      );
      if (totalTransit >= 50) {
        qualifies = true;
      }
    }

    if (badge.id === "energy-saver") {
      // At least 1 day with electricity < 10 units
      const lowEnergyDays = activities.some((act) => act.electricityUnits > 0 && act.electricityUnits < 10);
      if (lowEnergyDays) {
        qualifies = true;
      }
    }

    if (badge.id === "green-week-winner") {
      // 7-day streak
      if (user.streak >= 7) {
        qualifies = true;
      }
    }

    if (badge.id === "earth-guardian") {
      // Reached 500 total points
      if (user.points >= 500) {
        qualifies = true;
      }
    }

    if (qualifies) {
      newlyUnlocked.push(badge);
      user.badges.push(badge.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    await user.save();
  }

  return newlyUnlocked;
}

/**
 * Safely updates user streaks when logging daily data
 */
export async function updateDailyStreak(userId: string, dateStr: string) {
  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user) return;

  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const lastActiveStr = user.lastActive ? getLocalDateString(new Date(user.lastActive)) : null;

  if (lastActiveStr === yesterdayStr) {
    // Active yesterday, increment streak
    user.streak = (user.streak || 0) + 1;
  } else if (lastActiveStr === todayStr) {
    // Already checked in today, keep streak unchanged
  } else {
    // Streak broken, reset to 1
    user.streak = 1;
  }

  user.lastActive = new Date();
  await user.save();
}
