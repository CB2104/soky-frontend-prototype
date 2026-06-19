import { AdminLoginForm } from "@/features/admin/components/admin-login-form";

type AdminLoginPageProps = {
  params: Promise<{ adminPath: string }>;
};

export default async function AdminLoginPage({ params }: AdminLoginPageProps) {
  const { adminPath } = await params;
  return (
    <div className="grid min-h-[calc(100dvh-6rem)] place-items-center">
      <AdminLoginForm adminPath={adminPath} />
    </div>
  );
}
