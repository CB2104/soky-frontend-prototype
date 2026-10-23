"use client";

import { useId, useState, type ReactNode } from "react";
import Image from "next/image";
import type { FieldErrors } from "@/lib/catalog-validation";
import { permittedImage } from "@/lib/catalog-validation";
import styles from "./AdminWorkspace.module.css";

export function FormField({ name, label, value, onChange, errors = {}, type = "text", options, maxLength, required, readOnly, wide, hint, rows = 3 }: {
  name: string; label: string; value: string | number; onChange?: (value: string) => void; errors?: FieldErrors; type?: "text" | "textarea" | "number" | "decimal"; options?: { value: string; label: string }[]; maxLength?: number; required?: boolean; readOnly?: boolean; wide?: boolean; hint?: string; rows?: number;
}) {
  const id = useId();
  const props = { id, name, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange?.(event.target.value), className: styles.control, "aria-invalid": !!errors[name], "aria-describedby": errors[name] || hint ? `${id}-help` : undefined, required, readOnly };
  return <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
    <label htmlFor={id}>{label}{required ? " *" : ""}</label>
    {options ? <select {...props}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : type === "textarea" ? <textarea {...props} rows={rows} maxLength={maxLength} /> : <input {...props} type={type === "number" ? "number" : "text"} inputMode={type === "decimal" ? "decimal" : undefined} min={type === "number" ? 0 : undefined} max={type === "number" ? 1000000 : undefined} step={type === "number" ? 1 : undefined} maxLength={maxLength} />}
    {errors[name] || hint ? <span id={`${id}-help`} className={errors[name] ? styles.fieldError : styles.fieldHint}>{errors[name] ?? hint}</span> : null}
  </div>;
}
export function CheckField({ label, checked, onChange, error }: { label: string; checked: boolean; onChange: (checked: boolean) => void; error?: string }) {
  const id = useId();
  return <div><label className={styles.checkField}><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} aria-invalid={!!error} aria-describedby={error ? id : undefined} />{label}</label>{error ? <p id={id} className={styles.fieldError}>{error}</p> : null}</div>;
}
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className={styles.formSection}><h3 className={styles.panelTitle}>{title}</h3><div className={`${styles.formGrid} ${styles.formGridTwo}`}>{children}</div></section>;
}
export function ImagePreview({ src, alt, onBroken, compact = false }: { src: string; alt: string; onBroken?: (broken: boolean) => void; compact?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || !permittedImage(src)) return <p className={styles.fieldHint}>Selecciona una imagen para ver la vista previa.</p>;
  if (failedSrc === src) return <p className={styles.fieldError}>No se pudo cargar la imagen. Revisa el enlace o selecciona otra imagen.</p>;
  return <Image key={src} src={src} alt={alt} width={compact ? 42 : 180} height={compact ? 42 : 140} className={compact ? styles.productImage : styles.imagePreview} unoptimized onError={() => { setFailedSrc(src); onBroken?.(true); }} onLoad={() => onBroken?.(false)} />;
}
