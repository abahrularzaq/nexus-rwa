export const X402_PAYMENT_PREFIX = "x402-payment:";

export type StoredX402Payment = {
  /** URL pathname (+ search) used as storage key suffix. */
  path: string;
  paymentHeader: string;
  paidAt: number | null;
};

function parseStoredValue(raw: string): { paymentHeader: string; paidAt: number | null } {
  if (raw.startsWith("{")) {
    try {
      const o = JSON.parse(raw) as {
        paymentHeader?: string;
        txHash?: string;
        paidAt?: number;
      };
      if (typeof o.paymentHeader === "string") {
        return {
          paymentHeader: o.paymentHeader,
          paidAt: typeof o.paidAt === "number" ? o.paidAt : null,
        };
      }
      if (typeof o.txHash === "string") {
        return {
          paymentHeader: o.txHash,
          paidAt: typeof o.paidAt === "number" ? o.paidAt : null,
        };
      }
    } catch {
      /* legacy */
    }
  }
  return { paymentHeader: raw, paidAt: null };
}

/** Session storage key for a successful x402 payment header, scoped by endpoint path. */
export function getX402PaymentStorageKey(endpoint: string): string {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://placeholder.local";
    const url = endpoint.startsWith("http")
      ? new URL(endpoint)
      : new URL(endpoint, base);
    return `${X402_PAYMENT_PREFIX}${url.pathname}${url.search}`;
  } catch {
    return `${X402_PAYMENT_PREFIX}${endpoint}`;
  }
}

export function readStoredX402Payment(endpoint: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(getX402PaymentStorageKey(endpoint));
  if (!raw) return null;
  return parseStoredValue(raw).paymentHeader;
}

export function writeStoredX402Payment(endpoint: string, paymentHeader: string): void {
  if (typeof window === "undefined") return;
  const key = getX402PaymentStorageKey(endpoint);
  const payload = JSON.stringify({ paymentHeader, paidAt: Date.now() });
  sessionStorage.setItem(key, payload);
  window.dispatchEvent(new Event("nexus-x402-payment"));
  window.dispatchEvent(new Event("nexus-session-updated"));
}

export function clearStoredX402Payment(endpoint: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(getX402PaymentStorageKey(endpoint));
}

/** Backward-compatible aliases for older imports. */
export const getX402TxStorageKey = getX402PaymentStorageKey;
export const readStoredX402Tx = readStoredX402Payment;
export const writeStoredX402Tx = writeStoredX402Payment;
export const clearStoredX402Tx = clearStoredX402Payment;

/** All X402 payment records in `sessionStorage` for the current tab. */
export function listStoredX402Payments(): StoredX402Payment[] {
  if (typeof window === "undefined") return [];
  const out: StoredX402Payment[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(X402_PAYMENT_PREFIX)) continue;
    const path = key.slice(X402_PAYMENT_PREFIX.length);
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    const { paymentHeader, paidAt } = parseStoredValue(raw);
    out.push({ path, paymentHeader, paidAt });
  }
  return out.sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));
}
