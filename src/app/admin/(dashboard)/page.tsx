import { Metadata } from "next";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/session.server";
import { AdminClient } from "../admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SUBJECT ZERO // RESEARCH DIRECTOR CONSOLE",
  description: "Live investigation monitoring, team controls, and dispute resolution.",
};

export default async function AdminPage() {
  const isAdmin = await readAdminSession();
  if (!isAdmin) {
    redirect("/admin/login");
  }

  return <AdminClient />;
}
