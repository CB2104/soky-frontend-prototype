export function formatAdminAmount(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
