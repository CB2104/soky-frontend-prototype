import { NextResponse } from "next/server";
import { mockExchangeRate } from "@/mock/db";
import { errorResponse } from "@/mock/helpers";

export async function POST(request: Request) {
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Sesión requerida.", 401);
  }

  mockExchangeRate.fetchedAt = new Date().toISOString();
  mockExchangeRate.stale = false;
  mockExchangeRate.warning = "Tasa manual de prueba: no se consultó al proveedor. Fecha de vigencia pendiente.";

  return NextResponse.json(mockExchangeRate);
}
