// Marks content that is still streaming; it adds no visible placeholder.
export function SiteLoadingPending() {
  return <span hidden data-site-loading-pending />;
}
