import { handleDemoRequest } from "@/mock/demo-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `admin/order-intents/${encodeURIComponent(params.id)}`);
}
