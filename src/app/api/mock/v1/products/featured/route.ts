import { handleDemoRequest } from "@/mock/demo-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleDemoRequest(request, "products/featured");
}
