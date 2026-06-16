import type { AccessTier } from "@/types/x402";

export type PaymentEventName =
  | "payment_modal_open"
  | "payment_success"
  | "payment_fail"
  | "session_active";

export type PaymentEventPayload = {
  endpoint?: string;
  tier?: AccessTier;
  price?: string;
  currency?: string;
  wallet?: string;
  status?: string;
  error?: string;
  sessionExpiresAt?: string | null;
};

export function trackPaymentEvent(
  name: PaymentEventName,
  payload: PaymentEventPayload = {},
): void {
  if (typeof window === "undefined") return;

  const detail = {
    ...payload,
    name,
    timestamp: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("nexus-payment-event", { detail }));

  const analytics = (
    window as Window & {
      analytics?: { track?: (event: string, properties?: unknown) => void };
      gtag?: (...args: unknown[]) => void;
    }
  ).analytics;
  analytics?.track?.(name, detail);

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void })
    .gtag;
  gtag?.("event", name, detail);
}
