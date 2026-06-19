import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CartCheckout } from "@/features/cart/components/cart-checkout";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu pedido SOKY, calcula el total autoritativo y continúa por WhatsApp.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <main className="bg-soky-paper text-soky-ink">
      <Container className="py-10 md:py-14">
        <CartCheckout />
      </Container>
    </main>
  );
}
