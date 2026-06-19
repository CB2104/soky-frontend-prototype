import { NextResponse } from "next/server";
import type { AdminProductUpdateDto } from "@/contracts/api";
import { mockProducts } from "@/mock/db";
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
  const index = mockProducts.findIndex((product) => product.id === id);

  if (index < 0) {
    return errorResponse("PRODUCT_NOT_FOUND", "Producto no encontrado.", 404);
  }

  const body = (await request.json().catch(() => null)) as AdminProductUpdateDto | null;
  mockProducts[index] = {
    ...mockProducts[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(mockProducts[index]);
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const index = mockProducts.findIndex((product) => product.id === id);

  if (index < 0) {
    return errorResponse("PRODUCT_NOT_FOUND", "Producto no encontrado.", 404);
  }

  mockProducts.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
