import { NextResponse } from "next/server";
import { mockOrderIntents } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  const { id } = await context.params;
  const order = mockOrderIntents.find((item) => item.id === id);

  if (!order) {
    return errorResponse("NOT_FOUND", "Pedido no encontrado.", 404);
  }

  return NextResponse.json(order);
}
