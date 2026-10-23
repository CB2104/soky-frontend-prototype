
export function buildWhatsAppUrl(phone: string, message: string, demoPreview = false) {
  if (demoPreview) return `/demo/whatsapp?text=${encodeURIComponent(message)}`;
  const normalizedPhone = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
