export const X402_TX_PREFIX = "x402-tx:";

export type StoredX402Payment = {
  /** URL pathname (+ search) used as storage key suffix. */
  path: string;
  txHash: string;
  paidAt: number | null;
};

function parseStoredValue(raw: string): { txHash: string; paidAt: number | null } {
  if (raw.startsWith("{")) {
    try {
      const o = JSON.parse(raw) as { txHash?: string; paidAt?: number };
      if (typeof o.txHash === "string") {
        return {
          txHash: o.txHash,
          paidAt: typeof o.paidAt === "number" ? o.paidAt : null,
        };
      }
    } catch {
      /* legacy */
    }
  }
  if (raw.startsWith("0x")) {
    return { txHash: raw, paidAt: null };
  }
  return { txHash: raw, paidAt: null };
}

/** Session storage key for a successful X402 payment tx hash, scoped by endpoint path. */
export function getX402TxStorageKey(endpoint: string): string {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://placeholder.local";
    const url = endpoint.startsWith("http")
      ? new URL(endpoint)
      : new URL(endpoint, base);
    return `${X402_TX_PREFIX}${url.pathname}${url.search}`;
  } catch {
    return `${X402_TX_PREFIX}${endpoint}`;
  }
}

export function readStoredX402Tx(endpoint: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(getX402TxStorageKey(endpoint));
  if (!raw) return null;
  return parseStoredValue(raw).txHash;
}

export function writeStoredX402Tx(endpoint: string, txHash: string): void {
  if (typeof window === "undefined") return;
  const key = getX402TxStorageKey(endpoint);
  const payload = JSON.stringify({ txHash, paidAt: Date.now() });
  sessionStorage.setItem(key, payload);
  window.dispatchEvent(new Event("nexus-x402-payment"));
  window.dispatchEvent(new Event("nexus-session-updated"));
}

export function clearStoredX402Tx(endpoint: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(getX402TxStorageKey(endpoint));
}

/** All X402 payment records in `sessionStorage` for the current tab. */
export function listStoredX402Payments(): StoredX402Payment[] {
  if (typeof window === "undefined") return [];
  const out: StoredX402Payment[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(X402_TX_PREFIX)) continue;
    const path = key.slice(X402_TX_PREFIX.length);
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    const { txHash, paidAt } = parseStoredValue(raw);
    out.push({ path, txHash, paidAt });
  }
  return out.sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));
}
