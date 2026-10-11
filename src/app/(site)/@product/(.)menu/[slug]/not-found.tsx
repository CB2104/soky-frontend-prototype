import { RecoveryScreen } from "@/components/ui/RecoveryScreen";

export default function ProductDialogNotFound() {
  return (
    <RecoveryScreen
      as="section"
      compact
      headingTag="h2"
      titleId="product-dialog-not-found"
      title="No encontramos este producto"
      description="Este enlace ya no está disponible. Explora el menú para elegir otro favorito."
      statusCode={404}
      primaryActionHref="/menu"
      primaryActionLabel="Ver menú"
    />
  );
}
