"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AuthLoginResponseDto } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { setAdminAccessToken } from "@/features/admin/session";

type AdminLoginFormProps = {
  adminPath: string;
};

export function AdminLoginForm({ adminPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@soky.test");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="soky-card mx-auto grid w-full max-w-md gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            const response = await apiClient.post<AuthLoginResponseDto>("/auth/login", {
              email,
              password,
            });
            setAdminAccessToken(response.accessToken);
            router.push(`/${adminPath}`);
          } catch {
            setError("No se pudo iniciar sesión.");
          }
        });
      }}
    >
      <div>
        <h1 className="text-3xl font-black">Admin SOKY</h1>
        <p className="mt-2 text-sm text-soky-muted">Acceso privado para operar el menú.</p>
      </div>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <input
          className="min-h-12 rounded-xl border border-soky-border px-4"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Password
        <input
          className="min-h-12 rounded-xl border border-soky-border px-4"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className="text-sm font-bold text-japan-seal">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Entrando" : "Entrar"}
      </Button>
    </form>
  );
}
