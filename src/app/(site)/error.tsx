"use client";

import { useTransition } from "react";
import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function SiteError({ retry }: ErrorProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <RecoveryScreen
        as="main"
        compact
        title="No pudimos cargar esta página"
        description="Hubo un problema al cargar el contenido. Intenta de nuevo o vuelve al inicio."
        primaryActionLabel="Reintentar"
        primaryActionPendingLabel="Reintentando…"
        onPrimaryAction={() => startTransition(() => retry())}
        isPending={isPending}
      />
      <SiteReadySignal />
    </>
  );
}
