import type { CartQuoteRequestDto, CartQuoteResponseDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function quoteCart(body: CartQuoteRequestDto) {
  return apiClient.post<CartQuoteResponseDto>("/cart/quote", body);
}
