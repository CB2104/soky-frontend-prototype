import { SiteReadySignal } from "@/providers/SiteLoadingProvider";
import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export default function NotFound() {
  return (
    <>
      <RecoveryScreen
        title="Esta página se nos escapó"
        description="No encontramos la página que buscas. Vuelve al menú y descubre tus favoritos."
        statusCode={404}
        showLogo
        primaryActionHref="/menu"
        primaryActionLabel="Ver menú"
      />
      <SiteReadySignal />
    </>
  );
}
