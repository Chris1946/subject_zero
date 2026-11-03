"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 429) {
        setError("Too many failed attempts. Try again in 5 minutes.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Invalid credentials");
        setSubmitting(false);
        return;
      }

      // Successfully authenticated
      router.push("/admin");
    } catch {
      setError("Network error connecting to facility controller.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs uppercase text-text/70 mb-1.5 tracking-wider font-semibold"
        >
          DIRECTOR SECURITY KEY
        </label>
        <input
          id="admin-password"
          type="password"
          required
          minLength={1}
          maxLength={200}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••••••"
          autoFocus
          className="w-full bg-background border border-border px-3 py-2 text-sm text-text font-mono placeholder:text-text/30 focus:outline-none focus:border-emergency-red focus:ring-1 focus:ring-emergency-red"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="text-xs text-emergency-red border border-emergency-red/40 bg-emergency-red/10 p-2.5 font-mono tracking-wide"
        >
          [ACCESS DENIED: {error}]
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !password.trim()}
        className="w-full bg-panel hover:bg-border/60 text-text font-mono text-xs uppercase tracking-widest py-2.5 px-4 border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:border-emergency-red"
      >
        {submitting ? "AUTHENTICATING..." : "VERIFY AUTHORISATION"}
      </button>
    </form>
  );
}
