"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AuthLoginResponseDto } from "@/contracts/api";
import { Button } from "@/components/ui/button";
import { SokyLogo } from "@/components/brand/SokyLogo";
import { apiClient } from "@/lib/api/client";
import styles from "./AdminLoginForm.module.css";
import { safeAdminReturn } from "../return-path";

type AdminLoginFormProps = {
  adminPath: string;
};

export function AdminLoginForm({ adminPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@soky.test");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submitting = useRef(false);

  return (
    <form
      className={styles.panel}
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setError(null);
        startTransition(async () => {
          try {
            await apiClient.post<AuthLoginResponseDto>("/auth/login", {
              email,
              password,
            });
            const next = new URLSearchParams(window.location.search).get("next");
            router.replace(safeAdminReturn(next, adminPath));
            router.refresh();
          } catch {
            setError("No se pudo iniciar sesión.");
          } finally {
            submitting.current = false;
          }
        });
      }}
    >
      <SokyLogo title="SOKY" className={styles.logo} />
      <div>
        <p className={styles.eyebrow}>Administración SOKY</p>
        <h1 className={styles.title}>Entra a la demo</h1>
        <p className={styles.description}>Gestiona el catálogo y revisa la actividad de ejemplo.</p>
      </div>
      <div className={styles.demoNotice}>
        <strong>Demo con datos de ejemplo</strong>
        <span>Correo: admin@soky.test · Clave: demo</span>
      </div>
      <label className={styles.field} htmlFor="admin-email">
        Correo electrónico
        <input
          id="admin-email"
          className={styles.input}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className={styles.field} htmlFor="admin-password">
        Contraseña
        <input
          id="admin-password"
          className={styles.input}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Ingresando…" : "Entrar a la demo"}
      </Button>
    </form>
  );
}
