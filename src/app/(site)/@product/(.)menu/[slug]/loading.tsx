export default function LoadingProductDialog() {
  return (
    <section aria-busy="true" aria-labelledby="product-dialog-loading">
      <h2 id="product-dialog-loading" className="soky-heading text-3xl text-soky-blue">
        Cargando tu antojo…
      </h2>
      <p role="status" className="mt-4 text-soky-muted">
        Consultando el producto.
      </p>
      <div
        aria-hidden="true"
        className="mt-6 aspect-4/3 rounded-2xl bg-soky-blue/10"
      />
    </section>
  );
}
