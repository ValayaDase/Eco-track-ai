import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { getUserFromSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch top 10 users by points
    const topUsers = await User.find({ profileCompleted: true })
      .sort({ points: -1 })
      .limit(10)
      .select("name points streak badges");

    // Format top users
    const leaderboard = topUsers.map((u, idx) => ({
      rank: idx + 1,
      id: u._id.toString(),
      name: u.name,
      points: u.points || 0,
      streak: u.streak || 0,
      badgesCount: u.badges ? u.badges.length : 0,
    }));

    // Calculate current user's rank
    const currentUserDoc = await User.findById(user._id);
    const usersWithMorePoints = await User.countDocuments({
      profileCompleted: true,
      points: { $gt: currentUserDoc.points || 0 },
    });
    const userRank = usersWithMorePoints + 1;

    return NextResponse.json({
      leaderboard,
      userRank,
      userPoints: currentUserDoc.points || 0,
      userStreak: currentUserDoc.streak || 0,
    });
  } catch (error: any) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
