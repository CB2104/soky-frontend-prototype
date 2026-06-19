import { NextResponse } from "next/server";
import type { ConfirmOrderIntentResponseDto } from "@/contracts/api";
import { mockOrderIntents } from "@/mock/db";
import { applyScenarioDelay, errorResponse, getScenario } from "@/mock/helpers";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function findOrderFromToken(token: string) {
  if (!token.startsWith("demo-")) {
    return undefined;
  }

  const id = token.replace("demo-", "");
  return mockOrderIntents.find((order) => order.id === id) ?? mockOrderIntents[0];
}

export async function GET(request: Request, context: RouteContext) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  const { token } = await context.params;

  if (token.includes("expired")) {
    return errorResponse("ORDER_TOKEN_EXPIRED", "Este token expiró.", 410);
  }

  if (token.includes("used")) {
    return errorResponse("ORDER_TOKEN_USED", "Este token ya fue usado.", 409);
  }

  const order = findOrderFromToken(token);

  if (!order) {
    return errorResponse("ORDER_TOKEN_INVALID", "Token inválido.", 404);
  }

  return NextResponse.json(order);
}

export async function POST(request: Request, context: RouteContext) {
  const scenario = getScenario(request);
  await applyScenarioDelay(scenario);

  const { token } = await context.params;
  const order = findOrderFromToken(token);

  if (!order) {
    return errorResponse("ORDER_TOKEN_INVALID", "Token inválido.", 404);
  }

  if (order.status === "CONFIRMED_BY_OPERATOR") {
    return errorResponse("ORDER_TOKEN_USED", "Este token ya fue usado.", 409);
  }

  order.status = "CONFIRMED_BY_OPERATOR";
  order.confirmedAt = new Date().toISOString();

  const response: ConfirmOrderIntentResponseDto = {
    id: order.id,
    publicCode: order.publicCode,
    status: "CONFIRMED_BY_OPERATOR",
    confirmedAt: order.confirmedAt,
  };

  return NextResponse.json(response);
}
