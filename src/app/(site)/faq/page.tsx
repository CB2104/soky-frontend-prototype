import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas rápidas sobre pedidos, pickup, delivery y pagos en SOKY.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    question: "¿Los precios del carrito son finales?",
    answer:
      "El carrito guarda tu intención. El total autoritativo se calcula al confirmar el quote antes de abrir WhatsApp.",
  },
  {
    question: "¿Puedo pedir delivery?",
    answer:
      "Sí, si la zona está disponible. Para delivery debes agregar dirección antes de crear el pedido.",
  },
  {
    question: "¿Qué pasa si un producto deja de estar disponible?",
    answer:
      "El quote lo marcará como inválido y podrás quitarlo antes de continuar a WhatsApp.",
  },
  {
    question: "¿La tasa se actualiza sola desde la web pública?",
    answer:
      "No. La web pública solo muestra la tasa vigente. El refresh manual queda en el admin.",
  },
];

export default function FaqPage() {
  return (
    <main className="bg-soky-paper text-soky-ink">
      <Container className="py-10 md:py-14">
        <div className="max-w-3xl">
          <h1 className="soky-heading text-5xl text-soky-blue md:text-7xl">FAQ</h1>
          <p className="mt-4 text-lg leading-8 text-soky-muted">
            Lo importante para pedir sin enredos.
          </p>
        </div>
        <div className="mt-10 grid gap-4">
          {faqs.map((item) => (
            <article key={item.question} className="soky-card p-5">
              <h2 className="text-xl font-black">{item.question}</h2>
              <p className="mt-2 leading-7 text-soky-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
