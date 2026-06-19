import { NextResponse } from "next/server";
import type { AdminSliderUpdateDto } from "@/contracts/api";
import { mockSliders } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockSliders.findIndex((slider) => slider.id === id);

  if (index < 0) {
    return errorResponse("NOT_FOUND", "Slider no encontrado.", 404);
  }

  const body = (await request.json().catch(() => null)) as AdminSliderUpdateDto | null;
  mockSliders[index] = {
    ...mockSliders[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(mockSliders[index]);
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockSliders.findIndex((slider) => slider.id === id);

  if (index < 0) {
    return errorResponse("NOT_FOUND", "Slider no encontrado.", 404);
  }

  mockSliders.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
