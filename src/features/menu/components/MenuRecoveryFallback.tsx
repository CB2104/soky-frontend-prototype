"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export function MenuRecoveryFallback() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <RecoveryScreen
      as="section"
      compact
      title="No pudimos cargar el menú"
      description="Hubo un problema al cargar el menú. Intenta de nuevo o vuelve al inicio."
      primaryActionLabel="Reintentar"
      primaryActionPendingLabel="Reintentando…"
      onPrimaryAction={() => startTransition(() => router.refresh())}
      isPending={isPending}
    />
  );
}
