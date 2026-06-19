export const navLinks = [
  { href: "/", title: "Inicio" },
  { href: "/menu", title: "Menú" },
  { href: "/faq", title: "FAQ" },
];

export type NavTabItem = {
  href: string;
  title: string;
};

export type NavTabsProps = {
  items: NavTabItem[];
};