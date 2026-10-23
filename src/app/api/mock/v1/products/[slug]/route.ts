import { handleDemoRequest } from "@/mock/demo-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `products/${encodeURIComponent(params.slug)}`);
}
