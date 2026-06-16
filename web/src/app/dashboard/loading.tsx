function PanelSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="terminal-panel border-[#00D1FF]/15 p-5 shadow-[0_0_28px_rgba(0,209,255,0.06)]">
      <div className="h-4 w-32 animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
      <div className="mt-3 h-6 w-48 animate-pulse rounded bg-[rgba(30,42,58,0.75)]" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: tall ? 6 : 3 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-lg bg-[rgba(30,42,58,0.55)]"
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-10">
      <header className="border-b border-[#00D1FF]/15 pb-5">
        <div className="h-4 w-44 animate-pulse rounded bg-[rgba(30,42,58,0.85)]" />
        <div className="mt-3 h-8 w-80 max-w-full animate-pulse rounded bg-[rgba(30,42,58,0.75)]" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-[rgba(30,42,58,0.55)]" />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PanelSkeleton key={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.55fr]">
        <PanelSkeleton tall />
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelSkeleton tall />
          <PanelSkeleton tall />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PanelSkeleton tall />
        <PanelSkeleton tall />
      </section>

      <PanelSkeleton tall />
    </div>
  );
}
