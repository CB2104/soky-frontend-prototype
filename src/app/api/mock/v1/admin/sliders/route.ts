import { NextResponse } from "next/server";
import type { AdminSliderCreateDto, SliderItemDto } from "@/contracts/api";
import { mockSliders } from "@/mock/db";
import { errorResponse, paginate } from "@/mock/helpers";

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    paginate(
      mockSliders,
      Number(searchParams.get("page") ?? "1"),
      Number(searchParams.get("limit") ?? "20"),
    ),
  );
}

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const body = (await request.json().catch(() => null)) as AdminSliderCreateDto | null;

  if (!body?.title || !body.imageUrl || !body.imageAlt) {
    return errorResponse("VALIDATION_ERROR", "Faltan campos requeridos.", 422);
  }

  const slider: SliderItemDto = {
    id: `slider-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockSliders.push(slider);
  return NextResponse.json(slider, { status: 201 });
}
