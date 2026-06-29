"use client";

import { create } from "zustand";

type UiOverlayState = {
  isMobileNavOpen: boolean;
  isContactSpeedDialOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  openContactSpeedDial: () => void;
  closeContactSpeedDial: () => void;
  toggleContactSpeedDial: () => void;
  closeAllUiOverlays: () => void;
};

export const useUiOverlayStore = create<UiOverlayState>()((set) => ({
  isMobileNavOpen: false,
  isContactSpeedDialOpen: false,

  openMobileNav: () =>
    set({
      isMobileNavOpen: true,
      isContactSpeedDialOpen: false,
    }),

  closeMobileNav: () =>
    set({
      isMobileNavOpen: false,
    }),

  openContactSpeedDial: () =>
    set({
      isContactSpeedDialOpen: true,
      isMobileNavOpen: false,
    }),

  closeContactSpeedDial: () =>
    set({
      isContactSpeedDialOpen: false,
    }),

  toggleContactSpeedDial: () =>
    set((state) => {
      const nextIsContactSpeedDialOpen = !state.isContactSpeedDialOpen;

      return {
        isContactSpeedDialOpen: nextIsContactSpeedDialOpen,
        isMobileNavOpen: nextIsContactSpeedDialOpen
          ? false
          : state.isMobileNavOpen,
      };
    }),

  closeAllUiOverlays: () =>
    set({
      isMobileNavOpen: false,
      isContactSpeedDialOpen: false,
    }),
}));
