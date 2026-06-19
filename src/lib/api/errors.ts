import type { ApiErrorResponse } from "@/contracts/api";

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, error: ApiErrorResponse) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
