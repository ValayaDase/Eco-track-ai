import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { getUserFromSession } from "@/lib/auth";
import { DEFAULT_CHALLENGES } from "@/constants/challenges";
import { getLocalDateString } from "@/lib/helpers";
import { checkAndUnlockBadges, updateDailyStreak } from "@/services/carbon.service";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getLocalDateString();
    await connectToDatabase();

    // Fetch user's activity for today to retrieve completed challenges
    const activity = await Activity.findOne({ userId: user._id, date: today });
    const completedIds = activity ? activity.completedChallenges || [] : [];

    // Format active challenges list, highlighting which ones are completed
    const challenges = DEFAULT_CHALLENGES.map((ch) => ({
      ...ch,
      completed: completedIds.includes(ch.id),
    }));

    return NextResponse.json({
      challenges,
      points: user.points || 0,
      streak: user.streak || 0,
      badges: user.badges || [],
    });
  } catch (error: any) {
    console.error("Fetch challenges error:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 });
    }

    const challenge = DEFAULT_CHALLENGES.find((ch) => ch.id === challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Invalid Challenge ID" }, { status: 400 });
    }

    const today = getLocalDateString();
    await connectToDatabase();

    // 1. Fetch or create today's activity document
    let activity = await Activity.findOne({ userId: user._id, date: today });
    if (!activity) {
      activity = await Activity.create({
        userId: user._id,
        date: today,
        completedChallenges: [],
      });
    }

    // 2. Check if challenge was already completed today
    if (activity.completedChallenges.includes(challengeId)) {
      return NextResponse.json({ error: "Challenge already completed today" }, { status: 400 });
    }

    // 3. Mark completed in activity log
    activity.completedChallenges.push(challengeId);
    await activity.save();

    // 4. Update user points and check streak
    const userDoc = await User.findById(user._id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    userDoc.points = (userDoc.points || 0) + challenge.points;
    await userDoc.save();

    // Update daily streak
    await updateDailyStreak(user._id.toString(), today);

    // 5. Check badge unlocks
    const newBadges = await checkAndUnlockBadges(user._id.toString());

    // Fetch refreshed user details
    const updatedUser = await User.findById(user._id).select("-password");

    return NextResponse.json({
      message: "Challenge completed! Points awarded.",
      pointsEarned: challenge.points,
      newBadges,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        points: updatedUser.points,
        streak: updatedUser.streak,
        badges: updatedUser.badges,
      },
    });
  } catch (error: any) {
    console.error("Complete challenge error:", error);
    return NextResponse.json({ error: "Failed to complete challenge" }, { status: 500 });
  }
}
