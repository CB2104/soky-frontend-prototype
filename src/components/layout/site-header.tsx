// import Link from "next/link";
// import type { PublicSettingsDto } from "@/contracts/api";
// import { SokyLogo } from "@/components/brand/soky-logo";
// import { Button } from "@/components/ui/button";
// import { CartButton } from "@/features/cart/components/cart-button";
// import { buildWhatsAppUrl } from "@/lib/whatsapp";

// const navItems = [
//   { href: "/", label: "Inicio" },
//   { href: "/menu", label: "Menú" },
//   { href: "/faq", label: "FAQ" },
// ];

// type SiteHeaderProps = {
//   settings: PublicSettingsDto;
// };

// export function SiteHeader({ settings }: SiteHeaderProps) {
//   const whatsappUrl = buildWhatsAppUrl(
//     settings.whatsappPhone,
//     "Hola SOKY, quiero hacer un pedido.",
//   );

//   return (
//     <header className="sticky top-0 z-30 border-b border-white/10 bg-soky-blue text-soky-white shadow-lg shadow-soky-navy/20">
//       <div className="soky-container flex min-h-20 items-center justify-between gap-4">
//         <Link href="/" aria-label="Ir al inicio">
//           <SokyLogo inverse />
//         </Link>
//         <nav className="hidden items-center gap-6 text-sm font-bold md:flex">
//           {navItems.map((item) => (
//             <Link key={item.href} href={item.href} className="underline-offset-8 hover:underline">
//               {item.label}
//             </Link>
//           ))}
//         </nav>
//         <div className="flex items-center gap-2">
//           <CartButton />
//           <Button
//             href={whatsappUrl}
//             target="_blank"
//             rel="noreferrer"
//             variant="whatsapp"
//             className="hidden sm:inline-flex"
//           >
//             WhatsApp
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }
