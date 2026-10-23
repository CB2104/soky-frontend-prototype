import { handleDemoRequest } from "@/mock/demo-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `order-intents/confirm/${encodeURIComponent(params.token)}`);
}
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `order-intents/confirm/${encodeURIComponent(params.token)}`);
}
