import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/states";
import { ConfirmOrderButton } from "@/features/checkout/components/confirm-order-button";
import { getOrderIntentConfirmation } from "@/features/checkout/api";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmación de pedido",
  robots: {
    index: false,
    follow: false,
  },
};

type ConfirmPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { token } = await params;
  const order = await getOrderIntentConfirmation(token).catch(() => null);

  if (!order) {
    return (
      <main className="bg-soky-paper text-soky-ink">
        <Container className="py-12">
          <ErrorState
            title="Token inválido o expirado"
            description="Este enlace no permite confirmar el pedido. Revisa el código con el operador."
            actionHref="/menu"
            actionLabel="Volver al menú"
          />
        </Container>
      </main>
    );
  }

  const canConfirm = order.status === "PENDING_WHATSAPP";

  return (
    <main className="bg-soky-paper text-soky-ink">
      <Container className="grid gap-6 py-10 lg:grid-cols-[1fr_380px]">
        <section className="soky-card p-6">
          <Badge variant={canConfirm ? "promo" : "success"}>{order.status}</Badge>
          <h1 className="soky-heading mt-5 text-5xl text-soky-blue md:text-7xl">
            Pedido {order.publicCode}
          </h1>
          <p className="mt-4 text-soky-muted">
            Revisa el resumen antes de confirmar. La confirmación se hace con POST.
          </p>
          <ul className="mt-6 space-y-3">
            {order.items.map((item) => (
              <li key={item.productId} className="rounded-2xl border border-soky-border p-4">
                <p className="font-black">{item.title}</p>
                <p className="text-sm text-soky-muted">
                  {item.quantity} x {item.unitPriceAmount} {item.unitPriceCurrency}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <aside className="soky-card p-6">
          <h2 className="text-2xl font-black">Total y tasa</h2>
          <p className="soky-number mt-4 text-5xl text-soky-orange-deep">
            {formatMoney(order.totals.totalVes, "VES")}
          </p>
          <p className="mt-3 text-sm text-soky-muted">
            Tasa usada: {order.rateSnapshot.rate} VES por {order.rateSnapshot.baseCurrency}
          </p>
          <div className="mt-6">
            <ConfirmOrderButton token={token} disabled={!canConfirm} />
          </div>
        </aside>
      </Container>
    </main>
  );
}
