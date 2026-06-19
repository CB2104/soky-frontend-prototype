import { NextResponse } from "next/server";
import { mockExchangeRate } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

export async function GET(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  return NextResponse.json([
    mockExchangeRate,
    {
      ...mockExchangeRate,
      rate: "36.10",
      fetchedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      ...mockExchangeRate,
      rate: "35.80",
      fetchedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ]);
}
