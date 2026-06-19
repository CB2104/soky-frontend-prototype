import { NextResponse } from "next/server";
import type { AuthRefreshResponseDto } from "@/contracts/api";
import { errorResponse } from "@/mock/helpers";

export async function POST(request: Request) {
  const refresh = request.headers.get("cookie")?.includes("soky_refresh=");

  if (!refresh) {
    return errorResponse("UNAUTHORIZED", "No hay refresh token.", 401);
  }

  return NextResponse.json<AuthRefreshResponseDto>({
    accessToken: "mock-access-token",
  });
}
