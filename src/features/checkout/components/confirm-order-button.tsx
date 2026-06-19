"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmOrderIntent } from "@/features/checkout/api";

type ConfirmOrderButtonProps = {
  disabled?: boolean;
  token: string;
};

export function ConfirmOrderButton({ disabled = false, token }: ConfirmOrderButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        disabled={disabled || isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            try {
              const response = await confirmOrderIntent(token);
              setMessage(`Pedido ${response.publicCode} confirmado.`);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "No se pudo confirmar.");
            }
          });
        }}
      >
        {isPending ? "Confirmando" : "Confirmar pedido"}
      </Button>
      {message ? (
        <p className="rounded-xl bg-soky-paper p-3 text-sm font-bold text-soky-ink">
          {message}
        </p>
      ) : null}
    </div>
  );
}
