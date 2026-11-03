import React from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-background text-text font-mono select-none">
      <div className="w-full max-w-md border border-panel bg-panel/80 p-8 shadow-2xl text-center space-y-6">
        <div className="text-xs text-cold-blue font-bold tracking-widest uppercase">
          ERROR 404 // ADDRESS UNRESOLVED
        </div>

        <div className="space-y-2">
          <h1 className="text-base font-bold text-text uppercase tracking-wider">
            SECTOR NOT FOUND
          </h1>
          <p className="text-xs text-text/60 leading-relaxed">
            The requested sector address or archive file does not exist in the Holloway facility containment map.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full min-h-[44px] py-2.5 px-4 bg-panel border border-cold-blue/60 text-cold-blue hover:bg-cold-blue hover:text-background font-mono text-xs uppercase tracking-widest font-bold transition-colors text-center leading-[24px]"
          >
            RETURN TO ACCESS PORTAL
          </Link>
        </div>
      </div>
    </main>
  );
}
