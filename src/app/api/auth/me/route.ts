import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileCompleted: user.profileCompleted,
        points: user.points,
        streak: user.streak,
        badges: user.badges,
      },
    });
  } catch (error) {
    console.error("Fetch me error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
