import { NextResponse } from "next/server";
import { mockUser } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  return NextResponse.json(mockUser);
}
