import { NextResponse } from "next/server";
import type { WhatsappClickedResponseDto } from "@/contracts/api";
import { mockOrderIntents } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  const { id } = await context.params;
  const order = mockOrderIntents.find((item) => item.id === id);

  if (!order) {
    return errorResponse("NOT_FOUND", "Pedido no encontrado.", 404);
  }

  order.whatsappClickedAt = new Date().toISOString();

  const response: WhatsappClickedResponseDto = {
    id: order.id,
    status: order.status,
    whatsappClickedAt: order.whatsappClickedAt,
  };

  return NextResponse.json(response);
}
