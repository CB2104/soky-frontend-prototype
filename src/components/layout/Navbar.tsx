"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants";
import NavTabs from "./NavTabs";
import { CartCountBadge } from "@/features/cart/components/CartCountBadge";
import { CartButton } from "@/features/cart/components/CartButton";
import AnimatedSokyLogo from "../brand/AnimatedSokyLogo";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { cn } from "@/lib/cn";

type NavbarProps = {
  whatsappUrl: string;
};

const NAVBAR_SCROLL_THRESHOLD = 8;

const Navbar = ({ whatsappUrl }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const isHeroOverlay = pathname === "/";
  const isCartPage = pathname === "/cart" || pathname.startsWith("/cart/");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > NAVBAR_SCROLL_THRESHOLD);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextIsScrolled = latest > NAVBAR_SCROLL_THRESHOLD;
    setIsScrolled((current) =>
      current === nextIsScrolled ? current : nextIsScrolled,
    );
  });

  return (
    <header
      className={cn(
        "top-0 z-50 h-[var(--navbar-height)] border-b text-soky-white transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out",
        "[@media(max-height:500px)_and_(orientation:landscape)]:h-14",
        isHeroOverlay ? "fixed inset-x-0" : "sticky",
        isHeroOverlay
          ? isScrolled
            ? "border-white/10 bg-soky-blue/75 shadow-lg shadow-soky-navy/20 backdrop-blur-md"
            : "border-transparent bg-transparent shadow-none backdrop-blur-none"
          : isCartPage ? "border-white/10 bg-soky-navy shadow-lg shadow-soky-navy/20" : "border-white/10 bg-soky-blue shadow-lg shadow-soky-navy/20",
      )}
    >
      <div className="soky-container flex h-full items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {!isCartPage ? <MobileNavDrawer items={navLinks} whatsappUrl={whatsappUrl} /> : null}
          <Link href="/" aria-label="Ir al inicio">
            <AnimatedSokyLogo className="h-12 w-auto [@media(max-height:500px)_and_(orientation:landscape)]:h-10" />
          </Link>
        </div>
        {!isCartPage ? <nav
          className="hidden md:block [@media(max-height:500px)_and_(orientation:landscape)]:!hidden"
          aria-label="Navegación principal"
        >
          <NavTabs items={navLinks} />
        </nav> : null}
        {isCartPage ? <CartCountBadge /> : <>
        <div className="hidden md:block">
          <CartButton />
        </div>
        <div className="md:hidden">
          <CartButton variant="compact" />
        </div>
        </>}
      </div>
    </header>
  );
};

export default Navbar;
