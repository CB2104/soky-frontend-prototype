import Link from "next/link";

type CartEmptyStateProps = {
  onClose: () => void;
};

export const CartEmptyState = ({ onClose }: CartEmptyStateProps) => {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-soky-white p-1 shadow-[0_14px_36px_rgb(7_5_74/0.08)] ring-1 ring-soky-blue/10">
      <div className="relative overflow-hidden rounded-3xl bg-soky-paper bg-[url('/images/endless-clouds.svg')] bg-size-[56px_28px] bg-repeat text-center">
        <div className="relative overflow-hidden rounded-3xl bg-soky-paper/80 px-5 py-7 text-center">
          <span
            aria-hidden="true"
            className="absolute -left-10 top-6 size-24 rounded-full bg-soky-blue/10 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="absolute -right-8 bottom-2 size-24 rounded-full bg-soky-orange/15 blur-2xl"
          />

          <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-soky-white shadow-[0_12px_28px_rgb(7_5_74/0.1),inset_0_1px_0_rgb(255_255_255/0.9)] ring-1 ring-soky-blue/10">
            <span className="text-2xl font-black text-soky-blue">0</span>
          </div>

          <p className="relative mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-soky-orange-deep">
            Carrito vac&iacute;o
          </p>

          <h3 className="relative mt-2 text-2xl font-black leading-none tracking-[-0.03em] text-soky-navy">
            Todav&iacute;a no hay productos
          </h3>

          <p className="relative mx-auto mt-3 max-w-65 text-sm leading-6 text-soky-muted">
            Explora el men&uacute; y agrega tus piezas favoritas para revisar el
            pedido aqu&iacute; antes de continuar.
          </p>

          <div className="grid mt-4 gap-3">
            <Link
              href="/menu"
              className="group inline-flex w-full touch-manipulation rounded-full bg-soky-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 shadow-[0_12px_24px_rgb(236_99_35/0.18)]"
              onClick={onClose}
            >
              <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-soky-orange bg-[url('/images/endless-clouds-light.svg')] bg-size-[56px_28px] bg-repeat px-4 text-sm font-bold text-soky-white transition-[background-color,transform] duration-200 group-hover:bg-soky-orange-deep group-active:scale-[0.98] group-active:bg-soky-orange-deep">
                Explorar men&uacute;
              </span>
            </Link>
          </div>

          <p className="relative mt-3 text-xs leading-5 text-soky-muted">
            Puedes volver al carrito cuando agregues un producto.
          </p>
        </div>
      </div>
    </div>
  );
};
