"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AnalyticsTeaserPanel({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className="terminal-panel p-5">
      <p className="terminal-label">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[var(--border-panel)] bg-[var(--bg-panel)]/60 px-4">
        <p className="text-center font-mono text-xs text-[var(--text-label)]">
          Full visualization on dedicated workspace
        </p>
      </div>
      <Link
        href={href}
        className="terminal-label mt-4 inline-flex items-center gap-1 text-[var(--accent-amber)] hover:underline"
      >
        {linkLabel}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </section>
  );
}
