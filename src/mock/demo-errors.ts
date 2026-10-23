export class DemoError extends Error {
  constructor(public code: string, message: string, public status = 422, public fields?: Record<string, string>) {
    super(message);
  }
}

export function invalid(field: string, message: string): never {
  throw new DemoError("VALIDATION_ERROR", message, 422, { [field]: message });
}
