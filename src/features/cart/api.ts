import type { CartQuoteRequestDto, CartQuoteResponseDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";
import { verifyDemoRevision } from "@/features/demo/revision-client";
import { apiMode } from "@/lib/env";

export async function quoteCart(body: CartQuoteRequestDto) {
  if (apiMode === "mock" && typeof window !== "undefined") await verifyDemoRevision();
  return apiClient.post<CartQuoteResponseDto>("/cart/quote", body);
}
