import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export default function SiteNotFound() {
  return (
    <>
      <RecoveryScreen
        as="section"
        compact
        title="Esta página se nos escapó"
        description="No encontramos la página que buscas. Vuelve al menú y descubre tus favoritos."
        statusCode={404}
        primaryActionHref="/menu"
        primaryActionLabel="Ver menú"
      />
      <SiteReadySignal />
    </>
  );
}
