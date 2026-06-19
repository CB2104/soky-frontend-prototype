import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunitoSans = localFont({
  src: [
    {
      path: "../../public/fonts/Nunito/NunitoSans-VariableFont_YTLC,opsz,wdth,wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/Nunito/NunitoSans-Italic-VariableFont_YTLC,opsz,wdth,wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-nunito-sans",
  display: "swap",
});

const anton = localFont({
  src: "../../public/fonts/Anton/Anton-Regular.ttf",
  variable: "--font-anton",
  display: "swap",
  weight: "400",
});

const siteTitle = "SOKY Sushi | Rolls, boxes y promos para compartir";
const siteDescription =
  "Sushi casual, colorido y facil de pedir: rolls, boxes generosos, entradas y promos para compartir con pedido directo por WhatsApp.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SOKY",
  title: {
    default: siteTitle,
    template: "%s | SOKY Sushi",
  },
  description: siteDescription,
  keywords: [
    "SOKY",
    "@soky_ve",
    "sushi casual",
    "rolls",
    "boxes de sushi",
    "promos de sushi",
    "sushi tempura",
    "entradas japonesas",
    "pedido por WhatsApp",
  ],
  authors: [{ name: "SOKY" }],
  creator: "SOKY",
  publisher: "SOKY",
  category: "Restaurante",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es",
    url: "/",
    siteName: "SOKY",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    creator: "@soky_ve",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${nunitoSans.variable} ${anton.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
