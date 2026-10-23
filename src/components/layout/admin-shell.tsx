"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SokyLogo } from "@/components/brand/SokyLogo";
import { logoutDemo } from "@/features/admin/demo-client";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  adminPath: string;
  children: ReactNode;
};

const navigation = [
  { href: "", label: "Resumen" },
  { href: "products", label: "Productos" },
  { href: "categories", label: "Categorías" },
  { href: "sliders", label: "Hero y promociones" },
  { href: "settings", label: "Configuración" },
  { href: "exchange-rates", label: "Tasas" },
  { href: "analytics", label: "Analítica" },
  { href: "order-intents", label: "Intenciones" },
  { href: "demo", label: "Demo y restauración" },
];

export function AdminShell({ adminPath, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const menuOpen = menuOpenPath === pathname;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const basePath = `/${adminPath}`;
  const isLogin = pathname === `${basePath}/login`;
  const currentItem = navigation.find((item) => {
    const href = item.href ? `${basePath}/${item.href}` : basePath;
    return item.href ? pathname === href || pathname.startsWith(`${href}/`) : pathname === href;
  });
  const pageTitle = currentItem?.label ?? "Administración";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (menuOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
    } else if (!menuOpen && dialog.open) {
      dialog.close();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    return () => {
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  function setMenuOpen(open: boolean) {
    setMenuOpenPath(open ? pathname : null);
  }

  async function handleLogout() {
    setLogoutError(false);
    setLogoutPending(true);
    try {
      await logoutDemo();
      setMenuOpen(false);
      router.replace(`/${adminPath}/login`);
      router.refresh();
    } catch {
      setLogoutError(true);
    } finally {
      setLogoutPending(false);
    }
  }

  if (isLogin) {
    return <div className={styles.loginPage}>{children}</div>;
  }

  function isActive(href: string) {
    const target = href ? `${basePath}/${href}` : basePath;
    return href ? pathname === target || pathname.startsWith(`${target}/`) : pathname === target;
  }

  function renderNavigation(location: "desktop" | "mobile") {
    return (
      <nav className={styles.navigation} aria-label="Navegación de administración">
        {navigation.map((item) => {
          const href = item.href ? `${basePath}/${item.href}` : basePath;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href || "summary"}
              href={href}
              className={styles.navigationLink}
              aria-current={active ? "page" : undefined}
              onClick={location === "mobile" ? () => setMenuOpen(false) : undefined}
            >
              <span className={styles.navigationIndicator} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href={basePath} className={styles.brand} aria-label="SOKY, ir al resumen">
          <SokyLogo title="" className={styles.logo} />
          <span>Administración</span>
        </Link>
        {renderNavigation("desktop")}
        <div className={styles.sidebarNote}>
          <span className={styles.demoDot} aria-hidden="true" />
          <div>
            <strong>Modo demostración</strong>
            <span>Datos de ejemplo</span>
          </div>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.mobileHeading}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-label="Abrir menú de administración"
              aria-haspopup="dialog"
              aria-controls="soky-admin-mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={styles.mobileTitleGroup}>
              <span className={styles.mobileBrand}>SOKY</span>
              <span className={styles.mobileTitle}>{pageTitle}</span>
            </div>
          </div>
          <div className={styles.desktopTitle}>
            <p>{pageTitle}</p>
          </div>
          <div className={styles.topbarActions}>
          <span className={styles.demoBadge} aria-label="Demo · datos de ejemplo">
              <span className={styles.demoDot} aria-hidden="true" />
              Demo
            </span>
            <Link href="/" className={styles.siteLink} target="_blank" rel="noreferrer">
              Ver sitio
              <span aria-hidden="true">↗</span>
            </Link>
            <span className={styles.user}>
              <span className={styles.userMark} aria-hidden="true">A</span>
              <span className={styles.userEmail}>admin@soky.test</span>
            </span>
            <button type="button" className={styles.logoutButton} disabled={logoutPending} onClick={handleLogout}>
              {logoutPending ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </header>
        {logoutError ? (
          <p className={styles.logoutError} role="alert">No pudimos cerrar la sesión. Intenta otra vez.</p>
        ) : null}

        <main className={styles.content}>{children}</main>
      </div>

      <dialog
        ref={dialogRef}
        id="soky-admin-mobile-menu"
        className={styles.mobileDialog}
        aria-labelledby="soky-admin-mobile-title"
        onCancel={(event) => {
          event.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => {
          if (menuOpen) setMenuOpen(false);
          menuButtonRef.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setMenuOpen(false);
        }}
      >
        <div className={styles.dialogPanel}>
          <div className={styles.dialogHeader}>
            <div>
              <span className={styles.dialogEyebrow}>SOKY · DEMO</span>
              <h2 id="soky-admin-mobile-title">Administración</h2>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
          {renderNavigation("mobile")}
          <div className={styles.dialogFooter}>
            <div className={styles.dialogDemoCopy}>
              <span className={styles.demoDot} aria-hidden="true" />
              Demo · datos de ejemplo
            </div>
            <button type="button" className={styles.dialogLogout} disabled={logoutPending} onClick={handleLogout}>
              {logoutPending ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
