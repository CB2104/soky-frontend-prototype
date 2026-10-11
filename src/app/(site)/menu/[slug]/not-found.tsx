import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export default function ProductNotFound() {
  return (
    <>
      <RecoveryScreen
        title="No encontramos este producto"
        description="Este enlace ya no está disponible. Explora el menú para elegir otro favorito."
        statusCode={404}
        primaryActionHref="/menu"
        primaryActionLabel="Ver menú"
      />
      <SiteReadySignal />
    </>
  );
}
