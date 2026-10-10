import type { PublicSettingsDto } from "@/contracts/api";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export type LocationHoursViewModel = {
  days: string;
  time?: string;
  note?: string;
};

export type PublicContactViewModel = {
  businessName: string;
  address?: string;
  hours: LocationHoursViewModel[];
  mapsUrl?: string;
  mapsEmbedUrl?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  instagramLabel?: string;
};

export type LocationViewModel = PublicContactViewModel;

function getHttpsUrl(value?: string) {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

function mapHours(line: string): LocationHoursViewModel {
  const separator = line.indexOf("·");
  if (separator < 0) return { days: line };

  const days = line.slice(0, separator).trim();
  const timeAndNote = line.slice(separator + 1).trim();
  const noteMatch = timeAndNote.match(/\s*(\([^()]+\))$/);

  return {
    days,
    time: noteMatch
      ? timeAndNote.slice(0, noteMatch.index).trim()
      : timeAndNote || undefined,
    note: noteMatch?.[1],
  };
}

export function mapPublicSettingsToContact(
  settings: PublicSettingsDto,
): PublicContactViewModel {
  const maps = getHttpsUrl(settings.googleMapsUrl);
  const embed = getHttpsUrl(settings.googleMapsEmbedUrl);
  const instagram = getHttpsUrl(settings.instagramUrl);
  const phone = settings.whatsappPhone.replace(/\D/g, "");

  const address = settings.address?.trim();
  const instagramIsValid =
    instagram?.hostname === "www.instagram.com" ||
    instagram?.hostname === "instagram.com";
  const instagramHandle = instagramIsValid
    ? instagram?.pathname.split("/").filter(Boolean)[0]
    : undefined;

  return {
    businessName: settings.businessName.trim() || "SOKY",
    address:
      address && address !== "Agregar dirección real del local"
        ? address
        : undefined,
    hours: settings.openingHoursDisplay
      .map((line) => line.trim())
      .filter(Boolean)
      .map(mapHours),
    mapsUrl:
      maps &&
      ["maps.app.goo.gl", "maps.google.com", "www.google.com"].includes(
        maps.hostname,
      ) &&
      (maps.hostname !== "maps.google.com" || maps.pathname !== "/")
        ? maps.href
        : undefined,
    mapsEmbedUrl:
      embed?.hostname === "www.google.com" &&
      embed.pathname === "/maps/embed" &&
      embed.searchParams.has("pb")
        ? embed.href
        : undefined,
    whatsappUrl:
      /^\d{10,15}$/.test(phone)
        ? buildWhatsAppUrl(
            phone,
            "Hola SOKY, quiero hacer un pedido para delivery o retiro.",
          )
        : undefined,
    instagramUrl: instagramIsValid ? instagram?.href : undefined,
    instagramLabel: instagramHandle ? `@${instagramHandle}` : undefined,
  };
}

export function mapPublicSettingsToLocation(
  settings: PublicSettingsDto,
): LocationViewModel {
  return mapPublicSettingsToContact(settings);
}
