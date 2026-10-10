"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/cart/store";
import { lockBodyScroll } from "@/lib/body-scroll-lock";
import styles from "./ProductDialog.module.css";

export function ProductDialog({ children }: { children: ReactNode }) {
  const router = useRouter();
  const cartOpen = useCartStore((state) => state.isOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const releaseScroll = lockBodyScroll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      dialog?.close();
      releaseScroll();
      // Evita robar foco a un nuevo diálogo, como el carrito.
      queueMicrotask(() => {
        const active = document.activeElement;
        if (opener?.isConnected && (active === document.body || active === opener)) {
          opener.focus({ preventScroll: true });
        }
      });
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (cartOpen) {
      dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
  }, [cartOpen]);

  function requestClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 160;
    timerRef.current = setTimeout(() => router.back(), delay);
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom
    ) {
      requestClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Detalle del producto"
      data-closing={closing}
      onClick={handleBackdrop}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Tu próximo antojo</p>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          aria-label="Cerrar detalle del producto"
          onClick={requestClose}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M6 6L18 18M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        </button>
      </header>
      <div className={styles.content}>{children}</div>
    </dialog>
  );
}
