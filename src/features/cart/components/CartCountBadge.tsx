"use client";
import { useCartStore } from "../store";
import { useCartHydration } from "../useCartHydration";
export function CartCountBadge() {
  const hydrated = useCartHydration();
  const units = useCartStore(state=>state.items.reduce((total,item)=>total+item.quantity,0));
  return <div className="flex items-center gap-3 font-bold text-sm"><span>Mi pedido</span><span className="grid min-w-9 min-h-9 place-items-center rounded-full bg-soky-orange-ink px-2 text-soky-white" role="status" aria-label={hydrated ? `${units} unidades en tu pedido` : "Cargando pedido"}>{hydrated ? units : "…"}</span></div>;
}
