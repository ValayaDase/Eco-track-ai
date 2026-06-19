import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Activity from "@/models/Activity";
import CarbonRecord from "@/models/CarbonRecord";
import Report from "@/models/Report";
import { getUserFromSession, getSessionCookieName, hashPassword, comparePassword } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Fetch user with password
    const userDoc = await User.findById(user._id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await comparePassword(currentPassword, userDoc.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    userDoc.password = await hashPassword(newPassword);
    await userDoc.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = user._id;

    // Cascade delete all records belonging to this user
    await Profile.deleteOne({ userId });
    await Activity.deleteMany({ userId });
    await CarbonRecord.deleteMany({ userId });
    await Report.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    const response = NextResponse.json({ message: "Account deleted successfully" });

    // Expire/Clear cookie
    response.cookies.set({
      name: getSessionCookieName(),
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 });
  }
}
