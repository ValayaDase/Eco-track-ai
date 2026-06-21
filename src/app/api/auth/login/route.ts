import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken, getSessionCookieName } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = LoginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const rememberMe = !!body.rememberMe; // Get optional remember me field

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      profileCompleted: user.profileCompleted,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profileCompleted: user.profileCompleted,
          points: user.points,
          streak: user.streak,
          badges: user.badges,
        },
      },
      { status: 200 }
    );

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
