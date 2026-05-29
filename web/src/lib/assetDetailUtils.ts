import type { AssetCategory } from "@/lib/shared";

export function categoryAccent(category: string): string {
  switch (category) {
    case "TREASURY":
      return "#00D4FF";
    case "CREDIT":
      return "#7C3AED";
    case "REAL_ESTATE":
      return "#00FF88";
    case "COMMODITIES":
      return "#FFB800";
    case "EQUITY":
      return "#FF6B9D";
    default:
      return "#8892A4";
  }
}

export function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatChange7d(change7d: number): string {
  const pct = change7d * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatYieldFraction(rate: number): string {
  const pct = rate <= 1 && rate >= -1 ? rate * 100 : rate;
  return `${pct.toFixed(2)}%`;
}

export function formatMinutesAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "unknown";
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 48) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatAssetAge(createdAt: Date | string): string {
  const start = new Date(createdAt).getTime();
  if (!Number.isFinite(start)) return "—";
  const days = Math.floor((Date.now() - start) / (24 * 60 * 60 * 1000));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const rem = Math.floor((days % 365) / 30);
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

export function sourceDisplayName(sourceId: string): string {
  const map: Record<string, string> = {
    defillama: "DeFi Llama",
    rwa_xyz: "rwa.xyz",
    onchain: "On-chain",
  };
  return map[sourceId] ?? sourceId;
}

export function sourceRawUrl(
  sourceId: string,
  protocol: string,
  symbol: string,
): string {
  const slug = protocol.toLowerCase().replace(/\s+/g, "-");
  if (sourceId === "defillama") {
    return `https://defillama.com/protocol/${encodeURIComponent(slug)}`;
  }
  if (sourceId === "rwa_xyz") {
    return `https://app.rwa.xyz/?search=${encodeURIComponent(symbol)}`;
  }
  return "https://etherscan.io";
}

const PROTOCOL_WEBSITES: Record<string, string> = {
  "Franklin Templeton": "https://www.franklintempleton.com",
  Superstate: "https://superstate.co",
  "Mountain Protocol": "https://mountainprotocol.com",
  Hashnote: "https://hashnote.com",
  "Flux Finance": "https://fluxfinance.com",
  Ondo: "https://ondo.finance",
  Centrifuge: "https://centrifuge.io",
  Maple: "https://maple.finance",
};

export function protocolWebsite(protocol: string): string | null {
  if (!protocol.trim()) return null;
  return PROTOCOL_WEBSITES[protocol] ?? null;
}

export function categoryAvgYield(
  assets: { category?: AssetCategory | string; yieldRate: number }[],
  category: string,
): number | null {
  const peers = assets.filter((a) => a.category === category);
  if (peers.length === 0) return null;
  const sum = peers.reduce((acc, a) => {
    const y = a.yieldRate <= 1 ? a.yieldRate * 100 : a.yieldRate;
    return acc + y;
  }, 0);
  return sum / peers.length;
}
