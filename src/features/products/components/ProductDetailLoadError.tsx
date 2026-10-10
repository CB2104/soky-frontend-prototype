"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProductDetailLoadError({
  headingTag = "h1",
  titleId = "product-load-error-title",
}: {
  headingTag?: "h1" | "h2";
  titleId?: string;
}) {
  const Heading = headingTag;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <section
      className="py-10 text-center"
      aria-labelledby={titleId}
      aria-busy={isPending}
    >
      <Heading
        id={titleId}
        className="soky-heading text-4xl text-soky-blue"
      >
        No pudimos cargar este producto
      </Heading>
      <p className="mx-auto mt-4 max-w-lg text-lg text-soky-muted">
        Intenta de nuevo en unos segundos o continúa recorriendo el menú.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
        >
          {isPending ? "Reintentando…" : "Reintentar"}
        </Button>
        <Button
          href="/menu"
          data-transition-ignore="true"
          variant="secondary"
        >
          Ver menú
        </Button>
      </div>
    </section>
  );
}
