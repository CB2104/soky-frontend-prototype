import { NextResponse } from "next/server";
import type { AdminCategoryUpdateDto } from "@/contracts/api";
import { mockCategories } from "@/mock/db";
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
  const index = mockCategories.findIndex((category) => category.id === id);

  if (index < 0) {
    return errorResponse("CATEGORY_NOT_FOUND", "Categoría no encontrada.", 404);
  }

  const body = (await request.json().catch(() => null)) as AdminCategoryUpdateDto | null;
  mockCategories[index] = {
    ...mockCategories[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(mockCategories[index]);
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockCategories.findIndex((category) => category.id === id);

  if (index < 0) {
    return errorResponse("CATEGORY_NOT_FOUND", "Categoría no encontrada.", 404);
  }

  mockCategories[index] = {
    ...mockCategories[index],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(mockCategories[index]);
}
