import { handleDemoRequest } from "@/mock/demo-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `admin/categories/${encodeURIComponent(params.id)}`);
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleDemoRequest(request, `admin/categories/${encodeURIComponent(params.id)}`);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleDemoRequest(request, `admin/categories/${encodeURIComponent(id)}`);
}
