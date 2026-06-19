import type { CategoryDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

export function getCategories() {
  return apiClient.get<CategoryDto[]>("/categories");
}
