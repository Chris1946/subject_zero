import { Metadata } from "next";
import { redirect } from "next/navigation";
import { readAdminSession } from "@/lib/session.server";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SUBJECT ZERO // RESEARCH DIRECTOR CONSOLE",
  description: "Restricted access portal for game administration and monitoring.",
};

export default async function AdminLoginPage() {
  const isAdmin = await readAdminSession();
  if (isAdmin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background text-text font-mono select-none">
      <div className="w-full max-w-md border border-emergency-red/40 bg-panel/90 p-8 shadow-2xl relative">
        <div className="mb-6 border-b border-border pb-4">
          <div className="text-[11px] text-emergency-red uppercase tracking-widest font-bold">
            SUBJECT ZERO // CLASSIFIED OPERATIONS
          </div>
          <h1 className="text-base font-bold tracking-wider text-text uppercase mt-1">
            RESEARCH DIRECTOR LOGIN
          </h1>
          <p className="text-xs text-text/50 mt-1">
            Authorised research personnel only. All access attempts are recorded.
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}
