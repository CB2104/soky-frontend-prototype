import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HomeLoadingBoundary } from "@/features/home/loading/HomeLoadingBoundary";

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

const montserrat = localFont({
  src: [
    {
      path: "../../public/fonts/Montserrat/Montserrat-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

const kalam = localFont({
  src: [
    {
      path: "../../public/fonts/Kalam/Kalam-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Kalam/Kalam-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Kalam/Kalam-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kalam",
  display: "swap",
});

const anton = localFont({
  src: "../../public/fonts/Anton/Anton-Regular.ttf",
  variable: "--font-anton",
  display: "swap",
  weight: "400",
});

const outfit = localFont({
  src: "../../public/fonts/Outfit/Outfit-VariableFont_wght.ttf",
  variable: "--font-outfit",
  display: "swap",
});

const lilitaOne = localFont({
  src: "../../public/fonts/Lilita One/LilitaOne-Regular.ttf",
  variable: "--font-lilita-one",
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
    <html lang="es" data-scroll-behavior="smooth">
      <body
        className={`${nunitoSans.variable} ${montserrat.variable} ${kalam.variable} ${anton.variable} ${outfit.variable} ${lilitaOne.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        <HomeLoadingBoundary>{children}</HomeLoadingBoundary>
      </body>
    </html>
  );
}
