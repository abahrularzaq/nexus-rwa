"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";

type ApiTier = "free" | "pro" | "enterprise";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  tier: ApiTier;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  active: boolean;
};

type CreatedApiKey = ApiKey & { apiKey: string; warning: string };

const tierLabels: Record<ApiTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [name, setName] = useState("Production integration");
  const [tier, setTier] = useState<ApiTier>("pro");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeKey = useMemo(() => keys.find((key) => key.active) ?? null, [keys]);

  async function loadKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys", { cache: "no-store" });
      const json = (await res.json()) as { success: boolean; data?: ApiKey[]; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load API keys");
      setKeys(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadKeys(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function createKey() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tier }),
      });
      const json = (await res.json()) as { success: boolean; data?: CreatedApiKey; error?: string };
      if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? "Failed to create API key");
      setCreatedKey(json.data);
      setKeys((current) => [json.data!, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeKey(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/api-keys/${id}/revoke`, { method: "POST" });
      const json = (await res.json()) as { success: boolean; data?: ApiKey; error?: string };
      if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? "Failed to revoke API key");
      setKeys((current) => current.map((key) => (key.id === id ? json.data! : key)));
      if (createdKey?.id === id) setCreatedKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-[rgba(0,212,255,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.14),rgba(15,22,41,0.72)_42%,rgba(10,14,26,0.85))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="terminal-label text-[#00D4FF]">Developer Access</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">API Keys</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8892A4]">
              Generate, track, and revoke Nexus RWA API keys. Full keys are displayed only once at creation; stored records keep only a SHA-256 hash and public prefix.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(255,184,0,0.28)] bg-[rgba(255,184,0,0.08)] p-4">
            <p className="text-xs uppercase tracking-wide text-[#8892A4]">Active tier</p>
            <p className="mt-1 text-2xl font-bold text-[#FFB800]">{activeKey ? tierLabels[activeKey.tier] : "No active key"}</p>
            <p className="mt-1 text-xs text-[#8892A4]">Expiry: {activeKey ? formatDate(activeKey.expiresAt) : "—"}</p>
          </div>
        </div>
      </header>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      {createdKey ? (
        <section className="rounded-2xl border border-[rgba(0,255,136,0.28)] bg-[rgba(0,255,136,0.07)] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-[#00FF88]" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-white">API key generated</h2>
              <p className="mt-1 text-sm text-[#9AA4B2]">{createdKey.warning}</p>
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[rgba(0,255,136,0.22)] bg-[#0A0E1A] p-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="break-all font-mono text-sm text-[#00FF88]">{createdKey.apiKey}</code>
                <button type="button" onClick={() => void navigator.clipboard.writeText(createdKey.apiKey)} className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(0,255,136,0.3)] px-3 py-2 text-xs font-medium text-[#00FF88] hover:bg-[rgba(0,255,136,0.08)]"><Copy className="size-4" /> Copy</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5">
          <h2 className="flex items-center gap-2 font-semibold text-white"><Plus className="size-5 text-[#00D4FF]" /> Generate API key</h2>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Key name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]" />
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Tier</label>
          <select value={tier} onChange={(e) => setTier(e.target.value as ApiTier)} className="mt-2 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]"><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select>
          <button type="button" disabled={submitting} onClick={createKey} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-[#06111F] transition hover:bg-[#8DEBFF] disabled:cursor-not-allowed disabled:opacity-60"><KeyRound className="size-4" /> {submitting ? "Generating..." : "Generate API key"}</button>
        </div>

        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5">
          <h2 className="font-semibold text-white">Keys</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[#8892A4]"><tr className="border-b border-[rgba(30,42,58,0.8)]"><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Prefix</th><th className="py-3 pr-4">Tier</th><th className="py-3 pr-4">Expiry</th><th className="py-3 pr-4">Status</th><th className="py-3 text-right">Action</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="py-8 text-center text-[#8892A4]">Loading keys...</td></tr> : null}
                {!loading && keys.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-[#8892A4]">No API keys yet.</td></tr> : null}
                {keys.map((key) => (<tr key={key.id} className="border-b border-[rgba(30,42,58,0.55)] last:border-0"><td className="py-3 pr-4 text-white">{key.name}</td><td className="py-3 pr-4 font-mono text-[#00D4FF]">{key.prefix}...</td><td className="py-3 pr-4 text-[#C5CDD8]">{tierLabels[key.tier]}</td><td className="py-3 pr-4 text-[#8892A4]">{formatDate(key.expiresAt)}</td><td className="py-3 pr-4"><span className={key.active ? "text-[#00FF88]" : "text-[#8892A4]"}>{key.active ? "Active" : key.revokedAt ? "Revoked" : "Expired"}</span></td><td className="py-3 text-right"><button type="button" disabled={!key.active} onClick={() => void revokeKey(key.id)} className="inline-flex items-center gap-2 rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="size-3.5" /> Revoke</button></td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
