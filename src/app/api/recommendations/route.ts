import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { generateUserRecommendations } from "@/services/ai.service";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recommendations, segment } = await generateUserRecommendations(user._id.toString());
    
    return NextResponse.json({ recommendations, segment });
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
