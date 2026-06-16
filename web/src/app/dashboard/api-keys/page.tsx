"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Check, Copy, KeyRound, Play, Plus, ShieldCheck, Trash2 } from "lucide-react";

type ApiTier = "free" | "pro" | "enterprise";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  tier: ApiTier;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  rateLimitLimit: number;
  rateLimitRemaining: number;
  active: boolean;
};

type CreatedApiKey = ApiKey & { apiKey?: string; warning: string };
type TestResult = { status: number; body: unknown; remaining?: number; limit?: number };

const tierLabels: Record<ApiTier, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const tierDescriptions: Record<ApiTier, string> = {
  free: "1,000 requests / month for prototypes and local tests.",
  pro: "25,000 requests / month for production integrations.",
  enterprise: "250,000 requests / month with priority support.",
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [name, setName] = useState("Production integration");
  const [tier, setTier] = useState<ApiTier>("pro");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeKeys = useMemo(() => keys.filter((key) => key.active), [keys]);
  const selectedKey = useMemo(() => keys.find((key) => key.id === selectedKeyId) ?? activeKeys[0] ?? null, [activeKeys, keys, selectedKeyId]);
  const visibleSecret = createdKey?.apiKey;
  const exampleKey = visibleSecret ?? selectedKey?.prefix.concat("_REDACTED") ?? "nxrwa_YOUR_API_KEY";
  const exampleEndpoint = "/api/api-keys/test";
  const origin = typeof window === "undefined" ? "https://app.nexusrwa.example" : window.location.origin;

  async function loadKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys", { cache: "no-store" });
      const json = (await res.json()) as { success: boolean; data?: ApiKey[]; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load API keys");
      const nextKeys = json.data ?? [];
      setKeys(nextKeys);
      setSelectedKeyId((current) => (nextKeys.some((key) => key.id === current && key.active) ? current : nextKeys.find((key) => key.active)?.id ?? ""));
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
    setTestResult(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tier }),
      });
      const json = (await res.json()) as { success: boolean; data?: CreatedApiKey; error?: string };
      if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? "Failed to create API key");
      setCreatedKey(json.data);
      setSelectedKeyId(json.data.id);
      setKeys((current) => [json.data!, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCreatedKey() {
    if (!createdKey?.apiKey) return;
    await navigator.clipboard.writeText(createdKey.apiKey);
    setCreatedKey((current) => {
      if (!current) return current;
      return {
        ...current,
        apiKey: undefined,
        warning: "Copied. For your security, the full secret is now hidden and cannot be displayed again.",
      };
    });
  }

  async function testRequest() {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const res = await fetch(exampleEndpoint, { headers: { Authorization: `Bearer ${visibleSecret ?? ""}` }, cache: "no-store" });
      const body = await res.json();
      setTestResult({ status: res.status, body, remaining: Number(res.headers.get("x-ratelimit-remaining") ?? selectedKey?.rateLimitRemaining), limit: Number(res.headers.get("x-ratelimit-limit") ?? selectedKey?.rateLimitLimit) });
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run test request");
    } finally {
      setTesting(false);
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
            <p className="mt-2 max-w-2xl text-sm text-[#8892A4]">Generate, copy once, test, monitor usage, and revoke Nexus RWA API keys. Full secrets are shown only immediately after creation and are never returned by the API again.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[rgba(255,184,0,0.28)] bg-[rgba(255,184,0,0.08)] p-4"><p className="text-xs uppercase tracking-wide text-[#8892A4]">Selected tier</p><p className="mt-1 text-2xl font-bold text-[#FFB800]">{selectedKey ? tierLabels[selectedKey.tier] : tierLabels[tier]}</p><p className="mt-1 text-xs text-[#8892A4]">{selectedKey ? `Expires ${formatDate(selectedKey.expiresAt)}` : tierDescriptions[tier]}</p></div>
            <div className="rounded-xl border border-[rgba(0,255,136,0.24)] bg-[rgba(0,255,136,0.07)] p-4"><p className="text-xs uppercase tracking-wide text-[#8892A4]">Rate limit remaining</p><p className="mt-1 text-2xl font-bold text-[#00FF88]">{selectedKey ? `${selectedKey.rateLimitRemaining.toLocaleString()} / ${selectedKey.rateLimitLimit.toLocaleString()}` : "—"}</p><p className="mt-1 text-xs text-[#8892A4]">Usage: {selectedKey ? selectedKey.usageCount.toLocaleString() : 0} requests</p></div>
          </div>
        </div>
      </header>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

      {createdKey ? <section className="rounded-2xl border border-[rgba(0,255,136,0.28)] bg-[rgba(0,255,136,0.07)] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#00FF88]" /><div className="min-w-0 flex-1"><h2 className="font-semibold text-white">API key generated</h2><p className="mt-1 text-sm text-[#9AA4B2]">{createdKey.warning}</p>{createdKey.apiKey ? <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[rgba(0,255,136,0.22)] bg-[#0A0E1A] p-3 sm:flex-row sm:items-center sm:justify-between"><code className="break-all font-mono text-sm text-[#00FF88]">{createdKey.apiKey}</code><button type="button" onClick={() => void copyCreatedKey()} className="inline-flex items-center justify-center gap-2 rounded-md border border-[rgba(0,255,136,0.3)] px-3 py-2 text-xs font-medium text-[#00FF88] hover:bg-[rgba(0,255,136,0.08)]"><Copy className="size-4" /> Copy once</button></div> : <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[rgba(0,255,136,0.22)] bg-[#0A0E1A] px-3 py-2 text-sm text-[#00FF88]"><Check className="size-4" /> Secret hidden after copy</div>}</div></div></section> : null}

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5"><h2 className="flex items-center gap-2 font-semibold text-white"><Plus className="size-5 text-[#00D4FF]" /> Generate API key</h2><label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Key name</label><input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]" /><label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Tier</label><select value={tier} onChange={(e) => setTier(e.target.value as ApiTier)} className="mt-2 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]"><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select><p className="mt-2 text-xs text-[#8892A4]">{tierDescriptions[tier]}</p><button type="button" disabled={submitting} onClick={createKey} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-[#06111F] transition hover:bg-[#8DEBFF] disabled:cursor-not-allowed disabled:opacity-60"><KeyRound className="size-4" /> {submitting ? "Generating..." : "Generate API key"}</button></div>
        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5"><h2 className="font-semibold text-white">Keys and usage</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-[#8892A4]"><tr className="border-b border-[rgba(30,42,58,0.8)]"><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Prefix</th><th className="py-3 pr-4">Tier</th><th className="py-3 pr-4">Usage</th><th className="py-3 pr-4">Rate remaining</th><th className="py-3 pr-4">Last used</th><th className="py-3 pr-4">Status</th><th className="py-3 text-right">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="py-8 text-center text-[#8892A4]">Loading keys...</td></tr> : null}{!loading && keys.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-[#8892A4]">No API keys yet.</td></tr> : null}{keys.map((key) => <tr key={key.id} className="border-b border-[rgba(30,42,58,0.55)] last:border-0"><td className="py-3 pr-4 text-white">{key.name}</td><td className="py-3 pr-4 font-mono text-[#00D4FF]">{key.prefix}...</td><td className="py-3 pr-4 text-[#C5CDD8]">{tierLabels[key.tier]}</td><td className="py-3 pr-4 text-[#C5CDD8]">{key.usageCount.toLocaleString()}</td><td className="py-3 pr-4 text-[#00FF88]">{key.rateLimitRemaining.toLocaleString()}</td><td className="py-3 pr-4 text-[#8892A4]">{formatDate(key.lastUsedAt)}</td><td className="py-3 pr-4"><span className={key.active ? "text-[#00FF88]" : "text-[#8892A4]"}>{key.active ? "Active" : key.revokedAt ? "Revoked" : "Expired"}</span></td><td className="py-3 text-right"><button type="button" disabled={!key.active} onClick={() => void revokeKey(key.id)} className="inline-flex items-center gap-2 rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="size-3.5" /> Revoke</button></td></tr>)}</tbody></table></div></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5"><h2 className="flex items-center gap-2 font-semibold text-white"><Play className="size-5 text-[#00D4FF]" /> Test request</h2><p className="mt-2 text-sm text-[#8892A4]">Run a one-click request immediately after generating a key. After the copy-once secret is hidden, use the code samples with your stored secret instead.</p><label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Active key</label><select value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)} className="mt-2 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]"><option value="">Select an active key</option>{activeKeys.map((key) => <option key={key.id} value={key.id}>{key.name} ({key.prefix}...)</option>)}</select><button type="button" disabled={testing || !visibleSecret} onClick={() => void testRequest()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-[#06111F] transition hover:bg-[#8DEBFF] disabled:cursor-not-allowed disabled:opacity-50"><Activity className="size-4" /> {testing ? "Testing..." : "Send test request"}</button>{!visibleSecret ? <p className="mt-2 text-xs text-[#8892A4]">Generate a new key to test from the dashboard, or run the samples locally with a secret you already stored.</p> : null}{testResult ? <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3 text-xs text-[#C5CDD8]">{formatJson(testResult)}</pre> : null}</div>
        <div className="rounded-2xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.62)] p-5"><h2 className="font-semibold text-white">Code examples</h2><div className="mt-4 grid gap-4 lg:grid-cols-3"><pre className="overflow-auto rounded-lg bg-[#0A0E1A] p-4 text-xs text-[#C5CDD8]"><code>{`curl -H "Authorization: Bearer ${exampleKey}" \\\n  ${origin}${exampleEndpoint}`}</code></pre><pre className="overflow-auto rounded-lg bg-[#0A0E1A] p-4 text-xs text-[#C5CDD8]"><code>{`const res = await fetch("${exampleEndpoint}", {\n  headers: {\n    Authorization: \`Bearer ${exampleKey}\`,\n  },\n});\n\nconsole.log(await res.json());`}</code></pre><pre className="overflow-auto rounded-lg bg-[#0A0E1A] p-4 text-xs text-[#C5CDD8]"><code>{`import requests\n\nres = requests.get(\n    "${origin}${exampleEndpoint}",\n    headers={"Authorization": "Bearer ${exampleKey}"},\n)\n\nprint(res.json())`}</code></pre></div></div>
      </section>
    </div>
  );
}
