// Demo policy, not a production freshness rule. References tolerate five minutes
// of clock skew; fetchedAt is the reference time, never a network fetch time.
export const RATE_REVIEW_MS = 24 * 60 * 60 * 1000;
export const RATE_CLOCK_SKEW_MS = 5 * 60 * 1000;

export function normalizeManualRate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 20 || !/^\d+(?:[.,]\d{1,6})?$/.test(trimmed)) return null;
  const normalized = trimmed.replace(",", ".").replace(/^0+(?=\d)/, "");
  return Number(normalized) > 0 ? normalized : null;
}

export function validRateReference(value: string, now = Date.now()): boolean {
  // Require an explicit timezone at the API boundary.
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return false;
  const [, year, month, day, hour, minute, second = 0] = parts.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
    || hour > 23 || minute > 59 || Number(second) > 59) return false;
  return /^\d{4}-\d{2}-\d{2}T/.test(value)
    && Number.isFinite(Date.parse(value)) && Date.parse(value) <= now + RATE_CLOCK_SKEW_MS;
}

export function rateNeedsReview(reference: string, pending = false, now = Date.now()): boolean {
  return pending || !validRateReference(reference, now) || now - Date.parse(reference) >= RATE_REVIEW_MS;
}

export function caracasInputDate(value = new Date().toISOString()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function caracasReferenceUtc(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}:00-04:00`);
  if (!Number.isFinite(timestamp)) return null;
  const iso = new Date(timestamp).toISOString();
  return caracasInputDate(iso) === value && validRateReference(iso) ? iso : null;
}

export function formatRateDate(value: string): string {
  return Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value)) : "Fecha no disponible";
}
