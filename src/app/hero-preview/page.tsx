import { HeroPreviewScene } from "@/features/admin/hero/HeroPreviewScene";

export const dynamic = "force-dynamic";

export default async function HeroPreviewPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (!/^[\da-f-]{36}$/i.test(token)) return null;
  return <HeroPreviewScene token={token} />;
}
