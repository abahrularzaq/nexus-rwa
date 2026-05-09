/** X402 payment details returned on HTTP 402 from the API. */
export type X402Details = {
  price: string;
  currency: string;
  network: string;
  recipient: string;
  endpoint: string;
};

/** Typical JSON body when the backend responds with 402 Payment Required. */
export type X402ErrorResponse = {
  error: string;
  x402: X402Details;
};

export function isX402ErrorBody(value: unknown): value is X402ErrorResponse {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const x = o.x402;
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.price === "string" &&
    typeof d.currency === "string" &&
    typeof d.network === "string" &&
    typeof d.recipient === "string" &&
    typeof d.endpoint === "string"
  );
}
