import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "ecoTrackSecrectKey";
const COOKIE_NAME = "ecotrack_session";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string; profileCompleted?: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; profileCompleted?: boolean };
  } catch (error) {
    return null;
  }
}

export async function getUserFromSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");
    return user;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
