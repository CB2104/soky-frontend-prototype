import { NextResponse } from "next/server";
import type { AdminCategoryCreateDto, CategoryDto } from "@/contracts/api";
import { mockCategories } from "@/mock/db";
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
      mockCategories,
      Number(searchParams.get("page") ?? "1"),
      Number(searchParams.get("limit") ?? "20"),
    ),
  );
}

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const body = (await request.json().catch(() => null)) as AdminCategoryCreateDto | null;

  if (!body?.key || !body.name || !body.slug) {
    return errorResponse("VALIDATION_ERROR", "Faltan campos requeridos.", 422);
  }

  const category: CategoryDto = {
    id: `cat-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockCategories.push(category);
  return NextResponse.json(category, { status: 201 });
}
