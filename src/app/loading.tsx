export default function Loading() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-background text-text font-mono select-none">
      <div className="w-full max-w-sm border border-panel bg-panel/60 p-6 shadow-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-panel/60 pb-2 text-[10px] text-text/40 uppercase tracking-widest">
          <span>BIOS SZ-7 // BOOTLOADER</span>
          <span className="text-cold-blue animate-pulse">● INITIALIZING</span>
        </div>

        <div className="space-y-1 text-text/70 text-[11px] leading-relaxed">
          <p>&gt; VERIFYING HOST ARCHITECTURE... [OK]</p>
          <p>&gt; MOUNTING QUARANTINE PARTITIONS... [OK]</p>
          <p className="text-cold-blue">&gt; SYNCHRONIZING SECURE REPOSITORY...</p>
        </div>

        <div className="w-full bg-background border border-panel h-1.5 overflow-hidden mt-3">
          <div className="h-full bg-cold-blue w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  );
}
