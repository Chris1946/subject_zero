import { Suspense } from "react";
import { Metadata } from "next";
import { LeaderboardClient } from "./leaderboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SUBJECT ZERO // LEADERBOARD",
  description: "Official public standings and investigation timeline records.",
};

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-8 bg-background text-text font-mono">
          <div className="text-xs text-text/50 uppercase tracking-widest animate-pulse">
            LOADING INVESTIGATION ARCHIVES...
          </div>
        </main>
      }
    >
      <LeaderboardClient />
    </Suspense>
  );
}
