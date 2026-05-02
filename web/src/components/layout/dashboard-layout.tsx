"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Coins,
  Hexagon,
  LayoutDashboard,
  LineChart,
  Menu,
  RefreshCw,
  Shield,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

export interface DashboardLayoutProps {
  children: ReactNode;
  /** Segmen breadcrumb, mis. ['Assets', 'BTC Pool'] */
  breadcrumbs?: string[];
  /** Placeholder alamat wallet di top bar */
  walletPlaceholder?: string;
  onRefresh?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { id: "assets", label: "Assets", href: "/dashboard/assets", icon: Coins },
  { id: "yield-analytics", label: "Yield Analytics", href: "/dashboard/yield-analytics", icon: LineChart },
  { id: "risk-score", label: "Risk Score", href: "/dashboard/risk-score", icon: Shield },
  { id: "holders", label: "Holders", href: "/dashboard/holders", icon: Users },
  { id: "api-docs", label: "API Docs", href: "/dashboard/api-docs", icon: BookOpen },
];

function resolveActiveNavId(pathname: string, storeActive: string): string {
  for (const item of NAV_ITEMS) {
    if (item.href === "/dashboard") {
      if (pathname === "/dashboard" || pathname === "/dashboard/overview") return item.id;
      continue;
    }
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.id;
  }
  return storeActive;
}

export function DashboardLayout({
  children,
  breadcrumbs = ["Overview"],
  walletPlaceholder = "0x0000…0000",
  onRefresh,
}: DashboardLayoutProps): ReactElement {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const activePage = useUiStore((s) => s.activePage);
  const setActivePage = useUiStore((s) => s.setActivePage);

  const activeNavId = resolveActiveNavId(pathname, activePage);

  return (
    <div className="flex min-h-screen bg-nexus-bg-primary text-nexus-text-primary">
      {/* Overlay mobile */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-nexus-bg-primary/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-nexus-border bg-nexus-bg-secondary transition-transform duration-200 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-nexus-border px-4 md:justify-start">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight text-nexus-text-primary"
            onClick={() => {
              setActivePage("overview");
              setSidebarOpen(false);
            }}
          >
            <Hexagon className="size-7 text-nexus-accent-cyan" aria-hidden />
            <span className="text-sm">
              NEXUS <span className="text-nexus-accent-cyan">RWA</span>
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-nexus-text-secondary md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-nexus-accent-cyan bg-nexus-bg-tertiary text-nexus-accent-cyan"
                    : "text-nexus-text-secondary hover:bg-nexus-bg-tertiary/60 hover:text-nexus-text-primary",
                )}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[240px]">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-nexus-border bg-nexus-bg-primary/95 px-4 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-nexus-text-secondary md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>

          <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm text-nexus-text-secondary" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-nexus-text-muted" aria-hidden /> : null}
                <span
                  className={cn(
                    "truncate",
                    i === breadcrumbs.length - 1 ? "font-medium text-nexus-text-primary" : undefined,
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <div className="hidden items-center gap-2 rounded-md border border-nexus-border bg-nexus-bg-secondary px-3 py-1.5 font-mono text-xs text-nexus-text-secondary sm:flex">
            <Wallet className="size-3.5 shrink-0 text-nexus-accent-cyan" aria-hidden />
            <span>{walletPlaceholder}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0 border-nexus-border bg-nexus-bg-secondary text-nexus-text-secondary hover:bg-nexus-bg-tertiary hover:text-nexus-accent-cyan"
            onClick={onRefresh}
            aria-label="Segarkan data"
          >
            <RefreshCw className="size-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
