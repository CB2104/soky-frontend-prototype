export type MenuSourceDetails = {
  pieces?: number;
  quantity?: number;
  unit?: string;
  composition?: { type: string; quantity: number }[];
  components?: (string | { name: string; quantity: number })[];
  variants?: string[];
};

export type MenuSourceProduct = {
  id: string;
  name: string;
  price: number;
  description?: string;
  labels?: string[];
  group?: string;
  details?: MenuSourceDetails;
};

export type MenuSource = {
  restaurant: { name: string; instagram: string; currency: string };
  categories: {
    id: string;
    name: string;
    sortOrder: number;
    products: MenuSourceProduct[];
  }[];
};

export type CatalogProduct = {
  sourceId: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  sortOrder: number;
  priceCurrency: "EUR";
  priceAmount: string;
  description: string;
  descriptionSource: "SOURCE" | "DETAILS" | "PENDING";
  metadata?: string;
  labels: string[];
  beverageGroup?: string;
  details?: MenuSourceDetails;
  promotionEligible: boolean;
};

export type Catalog = {
  restaurant: MenuSource["restaurant"];
  categories: { id: string; name: string; sortOrder: number }[];
  products: CatalogProduct[];
};
