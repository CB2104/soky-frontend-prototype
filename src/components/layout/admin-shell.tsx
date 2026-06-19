import Link from "next/link";
import type { ReactNode } from "react";
import SokyLogo from "../brand/SokyLogo";

type AdminShellProps = {
  adminPath: string;
  children: ReactNode;
};

const navItems = [
  { href: "", label: "Dashboard" },
  { href: "products", label: "Products" },
  { href: "categories", label: "Categories" },
  { href: "sliders", label: "Sliders" },
  { href: "settings", label: "Settings" },
  { href: "exchange-rates", label: "Exchange rates" },
  { href: "analytics", label: "Analytics" },
  { href: "order-intents", label: "Orders" },
];

export function AdminShell({ adminPath, children }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-[#f7f7fb] text-soky-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-soky-border bg-soky-white p-5">
        <Link href={`/${adminPath}`} aria-label="Admin home">
          <SokyLogo />
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={`/${adminPath}${item.href ? `/${item.href}` : ""}`}
              className="rounded-xl px-3 py-2 text-sm font-bold text-soky-muted hover:bg-soky-paper hover:text-soky-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex min-h-16 items-center justify-between border-b border-soky-border bg-soky-white px-5">
          <p className="text-sm font-bold text-soky-muted">Ruta privada: /{adminPath}</p>
          <Link href="/" className="text-sm font-bold text-soky-blue">
            Ver sitio público
          </Link>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
