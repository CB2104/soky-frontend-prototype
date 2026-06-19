import { NextResponse } from "next/server";
import type { AuthLoginRequestDto, AuthLoginResponseDto } from "@/contracts/api";
import { mockUser } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AuthLoginRequestDto | null;

  if (!body?.email || !body.password) {
    return errorResponse("VALIDATION_ERROR", "Email y password son requeridos.", 422);
  }

  if (body.email !== mockUser.email || body.password.length < 4) {
    return errorResponse("UNAUTHORIZED", "Credenciales inválidas.", 401);
  }

  const response = NextResponse.json<AuthLoginResponseDto>({
    accessToken: "mock-access-token",
    user: mockUser,
  });

  response.cookies.set("soky_refresh", "mock-refresh-token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/api/mock/v1/auth",
  });

  return response;
}
