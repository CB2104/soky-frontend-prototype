import { AdminLoginForm } from "@/features/admin/components/admin-login-form";

type AdminLoginPageProps = {
  params: Promise<{ adminPath: string }>;
};

export default async function AdminLoginPage({ params }: AdminLoginPageProps) {
  const { adminPath } = await params;
  return <AdminLoginForm adminPath={adminPath} />;
}
