import type { ReactNode } from "react";
import { ProductDialog } from "@/features/products/components/ProductDialog";

export default async function ProductDialogLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDialog key={slug}>{children}</ProductDialog>;
}
