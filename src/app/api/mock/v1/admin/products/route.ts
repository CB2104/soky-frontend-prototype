import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { AdminProductCreateDto, ProductDto } from "@/contracts/api";
import { mockProducts } from "@/mock/db";
import { errorResponse, paginate } from "@/mock/helpers";

function requireAuth(request: Request) {
  return request.headers.get("authorization")?.startsWith("Bearer ");
}

export async function GET(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search")?.toLowerCase();
  const products = search
    ? mockProducts.filter((product) => product.title.toLowerCase().includes(search))
    : mockProducts;

  return NextResponse.json(paginate(products, page, limit));
}

export async function POST(request: Request) {
  if (!requireAuth(request)) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const body = (await request.json().catch(() => null)) as AdminProductCreateDto | null;

  if (!body?.title || !body.slug || !body.description || !body.categoryId) {
    return errorResponse("VALIDATION_ERROR", "Faltan campos requeridos.", 422);
  }

  const product: ProductDto = {
    id: `prod-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockProducts.push(product);
  revalidateTag("soky-menu-products", { expire: 0 });

  return NextResponse.json(product, { status: 201 });
}
