import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminPath as expectedAdminPath } from "@/lib/env";

export const metadata: Metadata = {
  title: "Admin SOKY",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ adminPath: string }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { adminPath } = await params;

  if (adminPath !== expectedAdminPath) {
    notFound();
  }

  return <AdminShell adminPath={adminPath}>{children}</AdminShell>;
}
