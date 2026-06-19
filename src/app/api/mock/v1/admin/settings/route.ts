import { NextResponse } from "next/server";
import type { AdminSettingsUpdateDto } from "@/contracts/api";
import { mockSettings } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  return NextResponse.json(mockSettings);
}

export async function PATCH(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const body = (await request.json().catch(() => null)) as AdminSettingsUpdateDto | null;

  if (body) {
    Object.assign(mockSettings, body);
  }

  return NextResponse.json(mockSettings);
}
