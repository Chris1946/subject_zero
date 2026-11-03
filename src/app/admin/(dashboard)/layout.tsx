import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/session.server";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await readAdminSession();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
