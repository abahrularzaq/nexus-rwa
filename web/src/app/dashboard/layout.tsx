"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  ShieldCheck,
  Code,
  KeyRound,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  Search,
  Database,
  Library,
  Activity,
  LogOut,
} from "lucide-react";

import { DashboardWalletButton } from "@/components/dashboard/DashboardWalletButton";
import { AskNexus } from "@/components/dashboard/AskNexus";
import { PaymentHistory } from "@/components/paywall/PaymentHistory";

const ADMIN_KEY_STORAGE = "nexus_admin_key";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Assets",
    href: "/dashboard/assets",
    icon: Layers,
    exact: false,
  },
  {
    label: "Screener",
    href: "/dashboard/screener",
    icon: Search,
    exact: false,
  },
  {
    label: "Data Layers",
    href: "/dashboard/layers",
    icon: Database,
    exact: false,
  },
  {
    label: "Market",
    href: "/dashboard/market",
    icon: BarChart3,
    exact: false,
  },
  {
    label: "Risk & Grade",
    href: "/dashboard/risk-grade",
    icon: ShieldCheck,
    exact: false,
  },
  {
    label: "Sources",
    href: "/dashboard/sources",
    icon: Library,
    exact: false,
  },
  {
    label: "Monitoring",
    href: "/dashboard/monitoring",
    icon: Activity,
    exact: false,
  },
  {
    label: "API Keys",
    href: "/dashboard/api-keys",
    icon: KeyRound,
    exact: false,
  },
  {
    label: "API Docs",
    href: "/dashboard/api-docs",
    icon: Code,
    exact: false,
  },
] as const;

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  layers: "Data Layers",
  assets: "Assets",
  screener: "Screener",
  market: "Market",
  "risk-grade": "Risk & Grade",
  sources: "Sources",
  monitoring: "Monitoring",
  "api-docs": "API Docs",
  "api-keys": "API Keys",
};

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function isNavActive(pathname: string, href: string, exact: boolean) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (exact) return p === h;
  return p === h || p.startsWith(`${h}/`);
}

function breadcrumbsFromPathname(pathname: string) {
  const segments = normalizePath(pathname).split("/").filter(Boolean);
  const items: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label =
      breadcrumbLabels[seg] ??
      seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    items.push({ label, href: acc });
  }
  return items;
}

function HexLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
        stroke="#00D4FF"
        strokeWidth="1.5"
        fill="rgba(0,212,255,0.12)"
      />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const crumbs = breadcrumbsFromPathname(pathname);
  const isMonitoringPage = isNavActive(pathname, "/dashboard/monitoring", false);

  function handleAdminLogout() {
    window.localStorage.removeItem(ADMIN_KEY_STORAGE);
    router.refresh();
  }

  return (
    <div className="dashboard-terminal min-h-screen bg-[var(--bg-primary)] text-white">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[rgba(30,42,58,0.8)] bg-[#0F1629] transition-transform duration-200 ease-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-[var(--border-line)] px-3 py-3">
            <Link
              href="/"
              onClick={closeSidebar}
              className="flex items-center gap-2.5 rounded-lg outline-none ring-[#00D4FF] focus-visible:ring-2"
            >
              <HexLogo />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold tracking-tight text-white">
                    NEXUS RWA
                  </span>
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00D4FF] ring-1 ring-[#00D4FF]/40">
                    BETA
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 py-3">
            {navItems.map(({ label, href, icon: Icon, exact }) => {
              const active = isNavActive(pathname, href, exact);
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={closeSidebar}
                  className={[
                    "flex items-center gap-2.5 rounded-r-md py-2 pl-2.5 pr-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "border-l-[3px] border-l-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"
                      : "border-l-[3px] border-l-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={2} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 border-t border-[var(--border-line)] px-3 py-3">
            <div className="flex items-center gap-2 text-xs text-[#8892A4]">
              <span className="size-2 shrink-0 rounded-full bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
              <span className="text-[#8892A4]">API Connected</span>
            </div>
            <PaymentHistory />
            <Link
              href="/"
              onClick={closeSidebar}
              className="block text-sm text-[#8892A4] transition-colors hover:text-white"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header
        className="fixed right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--border-line)] bg-[rgba(10,14,26,0.92)] px-3 backdrop-blur-md md:left-[240px]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-[#8892A4] transition-colors hover:bg-white/5 hover:text-white md:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <nav className="flex min-w-0 items-center gap-1 text-sm text-[#8892A4]" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex min-w-0 items-center gap-1">
                {i > 0 ? (
                  <ChevronRight className="size-4 shrink-0 text-[#4A5568]" aria-hidden />
                ) : null}
                {i === crumbs.length - 1 ? (
                  <span className="truncate font-medium text-white">{c.label}</span>
                ) : (
                  <Link
                    href={c.href}
                    className="truncate transition-colors hover:text-[var(--accent-amber)]"
                  >
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {isMonitoringPage ? (
            <button
              type="button"
              aria-label="Logout admin"
              title="Logout admin"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-line)] bg-white/[0.03] px-3 py-2 text-xs font-medium text-[#FF8888] transition hover:border-[#FF4444]/60 hover:bg-[#FF4444]/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleAdminLogout}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout Admin</span>
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Refresh"
            className="flex size-9 items-center justify-center rounded-md text-[#8892A4] transition-colors hover:bg-white/5 hover:text-white"
            onClick={() => router.refresh()}
          >
            <RefreshCw className="size-[18px]" />
          </button>
          <DashboardWalletButton />
        </div>
      </header>

      {/* Main */}
      <main
        className="min-h-screen bg-[var(--bg-primary)] px-4 pb-5 pt-[calc(48px+20px)] md:ml-[240px] md:px-5"
      >
        {children}
      </main>

      <AskNexus />
    </div>
  );
}
