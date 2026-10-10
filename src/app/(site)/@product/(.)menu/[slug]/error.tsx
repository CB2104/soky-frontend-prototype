"use client";

import { Button } from "@/components/ui/button";

export default function ProductDialogError({ reset }: { reset: () => void }) {
  return (
    <section aria-labelledby="product-dialog-error">
      <h2 id="product-dialog-error" className="soky-heading text-3xl text-soky-blue">
        No pudimos mostrar este producto
      </h2>
      <p className="mt-4 text-soky-muted">
        Intenta nuevamente o cierra el detalle.
      </p>
      <Button type="button" className="mt-6" onClick={reset}>
        Reintentar
      </Button>
    </section>
  );
}
