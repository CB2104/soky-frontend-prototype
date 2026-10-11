"use client";

import { useTransition } from "react";
import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function RootError({ retry }: ErrorProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <RecoveryScreen
        title="No pudimos cargar esta página"
        description="Hubo un problema al cargar el contenido. Intenta de nuevo o vuelve al inicio."
        showLogo
        primaryActionLabel="Reintentar"
        primaryActionPendingLabel="Reintentando…"
        onPrimaryAction={() => startTransition(() => retry())}
        isPending={isPending}
      />
      <SiteReadySignal />
    </>
  );
}
