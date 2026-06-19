import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-soky-paper px-4 text-soky-ink">
      <div className="max-w-md text-center">
        <p className="soky-number text-7xl text-soky-orange-deep">404</p>
        <h1 className="mt-4 text-3xl font-black">Página no encontrada</h1>
        <p className="mt-3 text-soky-muted">
          Ese enlace no está disponible. Puedes volver al menú y seguir armando tu pedido.
        </p>
        <Button href="/menu" className="mt-6">
          Ver menú
        </Button>
      </div>
    </main>
  );
}
