import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { getUserFromSession, signToken, getSessionCookieName } from "@/lib/auth";
import { ProfileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const profile = await Profile.findOne({ userId: user._id });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate body
    const validated = ProfileSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Create or update profile
    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, ...validated.data },
      { new: true, upsert: true }
    );

    // Update user profileCompleted state
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { profileCompleted: true },
      { new: true }
    );

    // Re-issue JWT session cookie with profileCompleted = true
    const token = signToken({
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      profileCompleted: true,
    });

    const response = NextResponse.json({
      message: "Profile saved successfully",
      profile,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        profileCompleted: true,
      },
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
