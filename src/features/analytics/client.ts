"use client";

import type { AnalyticsEventRequestDto } from "@/contracts/api";
import { apiClient } from "@/lib/api/client";

const sessionKey = "soky.analytics.session.v1";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionId() {
  const current = window.localStorage.getItem(sessionKey);

  if (current) {
    return current;
  }

  const next = createSessionId();
  window.localStorage.setItem(sessionKey, next);
  return next;
}

export function trackEvent(event: Omit<AnalyticsEventRequestDto, "sessionId">) {
  if (typeof window === "undefined") {
    return;
  }

  const body: AnalyticsEventRequestDto = {
    sessionId: getSessionId(),
    ...event,
  };

  void apiClient.post("/analytics/events", body).catch(() => undefined);
}
