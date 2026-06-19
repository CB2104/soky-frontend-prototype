import { redirect } from "next/navigation";

type DashboardRedirectProps = {
  params: Promise<{ adminPath: string }>;
};

export default async function DashboardRedirect({ params }: DashboardRedirectProps) {
  const { adminPath } = await params;
  redirect(`/${adminPath}`);
}
