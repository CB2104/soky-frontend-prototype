export type ProductEditorial = {
  isAvailable?: boolean;
  featured?: boolean;
  shortDescription?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageStatus?: "PENDING" | "PROVISIONAL" | "VERIFIED";
};

// Stock confirmado por el usuario el 6 de octubre; solo estas excepciones.
export const defaultProductAvailability = true;

export const productEditorial: Record<string, ProductEditorial> = {
  "box-kiyomi": {
    shortDescription: "Tempura para compartir.",
    imageUrl: "/images/products/box-kiyomi.webp",
    imageAlt: "Referencia provisional del Box Kiyomi.",
    imageStatus: "PROVISIONAL",
  },
  "box-kurama": {
    isAvailable: false,
    shortDescription: "Fríos y tempura en un mismo box.",
  },
  "box-osaka": {
    shortDescription: "Fríos y tempura en un mismo box.",
    imageUrl: "/images/products/box-osaka.webp",
    imageAlt: "Referencia provisional del Box Osaka.",
    imageStatus: "PROVISIONAL",
  },
  "box-kyoto": {
    isAvailable: false,
    shortDescription: "Una selección de piezas tempura.",
    imageUrl: "/images/products/box-kyoto.webp",
    imageAlt: "Referencia provisional del Box Kyoto.",
    imageStatus: "PROVISIONAL",
  },
  "box-soky": {
    shortDescription: "Un box de piezas tempura.",
    imageUrl: "/images/products/box-soky.webp",
    imageAlt: "Referencia provisional del Box Soky.",
    imageStatus: "PROVISIONAL",
  },
  "box-samurai": {
    isAvailable: false,
    shortDescription: "Una selección de piezas frías.",
    imageUrl: "/images/products/box-samurai.webp",
    imageAlt: "Referencia provisional del Box Samurai.",
    imageStatus: "PROVISIONAL",
  },
};

export const pendingProductPhoto = "/images/products/product-photo-pending.svg";
