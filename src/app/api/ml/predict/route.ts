import { NextResponse } from "next/server";
import { predictCarbon } from "@/lib/ml/predictor";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prediction = predictCarbon(
      body.features
    );

    return NextResponse.json(prediction);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Prediction failed";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      }
    );
  }
}
