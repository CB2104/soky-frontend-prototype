import { NextResponse } from "next/server";
import { adminAnalyticsSliders } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

export async function GET(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  return NextResponse.json(adminAnalyticsSliders);
}
