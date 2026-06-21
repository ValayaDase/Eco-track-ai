import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken, getSessionCookieName } from "@/lib/auth";
import { SignupSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = SignupSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileCompleted: false,
    });

    // Create session token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      profileCompleted: false,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          profileCompleted: user.profileCompleted,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
