"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export function ProductDetailLoadError({
  headingTag = "h1",
  titleId = "product-load-error-title",
}: {
  headingTag?: "h1" | "h2";
  titleId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <RecoveryScreen
      as="section"
      compact
      headingTag={headingTag}
      titleId={titleId}
      title="No pudimos cargar esta página"
      description="Hubo un problema al cargar el contenido. Intenta de nuevo o vuelve al inicio."
      primaryActionLabel="Reintentar"
      primaryActionPendingLabel="Reintentando…"
      onPrimaryAction={() => startTransition(() => router.refresh())}
      isPending={isPending}
    />
  );
}
