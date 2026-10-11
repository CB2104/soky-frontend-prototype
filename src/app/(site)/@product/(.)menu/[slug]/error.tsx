"use client";

import { useTransition } from "react";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export default function ProductDialogError({ retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <RecoveryScreen
      as="section"
      compact
      headingTag="h2"
      titleId="product-dialog-error"
      title="No pudimos cargar esta página"
      description="Hubo un problema al cargar el contenido. Intenta de nuevo o vuelve al inicio."
      primaryActionLabel="Reintentar"
      primaryActionPendingLabel="Reintentando…"
      onPrimaryAction={() => startTransition(() => retry())}
      isPending={isPending}
    />
  );
}
