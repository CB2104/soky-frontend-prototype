import { NextResponse } from "next/server";
import { mockOrderIntents } from "@/mock/db";
import { errorResponse, paginate } from "@/mock/helpers";

export async function GET(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    paginate(
      mockOrderIntents,
      Number(searchParams.get("page") ?? "1"),
      Number(searchParams.get("limit") ?? "20"),
    ),
  );
}
