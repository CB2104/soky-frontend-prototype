import type {
  ConfirmOrderIntentResponseDto,
  CreateOrderIntentRequestDto,
  CreateOrderIntentResponseDto,
  OrderIntentConfirmViewDto,
  WhatsappClickedResponseDto,
} from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function createOrderIntent(body: CreateOrderIntentRequestDto) {
  return apiClient.post<CreateOrderIntentResponseDto>("/order-intents", body);
}

export function registerWhatsappClicked(orderIntentId: string) {
  return apiClient.post<WhatsappClickedResponseDto>(
    `/order-intents/${orderIntentId}/whatsapp-clicked`,
  );
}

export function getOrderIntentConfirmation(token: string) {
  return apiClient.get<OrderIntentConfirmViewDto>(`/order-intents/confirm/${token}`);
}

export function confirmOrderIntent(token: string) {
  return apiClient.post<ConfirmOrderIntentResponseDto>(`/order-intents/confirm/${token}`);
}
