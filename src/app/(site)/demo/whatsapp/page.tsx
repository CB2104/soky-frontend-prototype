import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WhatsAppPreviewPage({ searchParams }: { searchParams: Promise<{ text?: string }> }) {
  const { text } = await searchParams;
  return <main className="mx-auto grid max-w-2xl gap-6 px-5 py-16">
    <h1 className="text-3xl font-bold text-soky-blue">Vista previa de WhatsApp</h1>
    <p>Demo · datos de ejemplo. Este mensaje permanece en la presentación y no se envía a ningún contacto.</p>
    <pre className="whitespace-pre-wrap rounded-xl border border-soky-border p-5">{typeof text === "string" ? text.slice(0, 5000) : "Hola SOKY, quiero hacer un pedido."}</pre>
    <Link className="font-bold underline" href="/cart">Volver al carrito</Link>
  </main>;
}
