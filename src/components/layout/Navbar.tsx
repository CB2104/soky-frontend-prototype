import Link from "next/link";
import { navLinks } from "@/constants";
import NavTabs from "./NavTabs";
import { CartButton } from "@/features/cart/components/CartButton";
import AnimatedSokyLogo from "../brand/AnimatedSokyLogo";
import { MobileNavDrawer } from "./MobileNavDrawer";

type NavbarProps = {
  whatsappUrl: string;
};

const Navbar = ({ whatsappUrl }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-soky-blue text-soky-white shadow-lg shadow-soky-navy/20">
      <div className="soky-container flex min-h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MobileNavDrawer items={navLinks} whatsappUrl={whatsappUrl} />
          <Link href="/" aria-label="Ir al inicio">
            <AnimatedSokyLogo className="h-12 w-auto" />
          </Link>
        </div>
        <nav className="hidden md:block" aria-label="Navegación principal">
          <NavTabs items={navLinks} />
        </nav>
        <div className="hidden md:block">
          <CartButton />
        </div>
        <div className="md:hidden">
          <CartButton variant="compact" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
