import type { SliderItemDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function getActiveSliders() {
  return apiClient.get<SliderItemDto[]>("/sliders/active");
}
