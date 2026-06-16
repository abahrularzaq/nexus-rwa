const endpoints = [
  ['GET', '/v1/export', 'Fetch the full dataset in JSON, CSV, or NDJSON.'],
  ['GET', '/v1/analytics/bulk', 'Fetch a normalized bulk analytics snapshot.'],
  ['POST', '/v1/ask', 'Ask natural-language questions over selected asset context.'],
  ['GET', '/v1/agent/manifest', 'Discover the agent-ready endpoint manifest.'],
] as const;

export default function AgentIntegrationPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-[#C5CDD8]">
      <a className="text-sm text-[#00D4FF] hover:text-white" href="/dashboard/api-docs">
        ← Back to API docs
      </a>
      <h1 className="mt-6 text-3xl font-bold text-white">AI Agent Integration Guide</h1>
      <p className="mt-3 text-sm leading-6 text-[#8892A4]">
        Use Nexus RWA Enterprise endpoints to fetch datasets, compare risk, yield, and source
        quality, then ask natural-language questions over shortlisted tokenized RWA assets.
      </p>

      <section className="mt-8 rounded-xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.55)] p-5">
        <h2 className="text-lg font-semibold text-white">Agent-ready endpoints</h2>
        <div className="mt-4 grid gap-3">
          {endpoints.map(([method, path, description]) => (
            <div key={path} className="rounded-lg border border-[rgba(30,42,58,0.75)] p-4">
              <p className="font-mono text-sm text-[#00D4FF]">
                {method} {path}
              </p>
              <p className="mt-1 text-sm text-[#8892A4]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-[rgba(255,184,0,0.24)] bg-[rgba(255,184,0,0.06)] p-5">
        <h2 className="text-lg font-semibold text-white">Recommended workflow</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#8892A4]">
          <li>Fetch the dataset with <code className="text-[#00D4FF]">/v1/export</code> or <code className="text-[#00D4FF]">/v1/analytics/bulk</code>.</li>
          <li>Compare candidate assets by risk, yield, source confidence, evidence freshness, and missing critical fields.</li>
          <li>Call <code className="text-[#00D4FF]">/v1/ask</code> with a natural-language question and shortlisted asset context.</li>
        </ol>
      </section>

      <p className="mt-8 text-sm text-[#8892A4]">
        Source markdown lives at <code className="text-[#00D4FF]">docs/agent-integration.md</code>.
        Responses are informational only and are not investment advice.
      </p>
    </main>
  );
}
