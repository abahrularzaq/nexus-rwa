export const DEV_API_KEY_STORAGE_KEY = "nexus_api_key";
export const WALLET_STORAGE_KEY = "nexus_wallet_address";

export function readDeveloperApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEV_API_KEY_STORAGE_KEY)?.trim() || null;
}

export function developerApiKeyHeader(): Record<string, string> {
  const apiKey = readDeveloperApiKey();
  return apiKey ? { "X-API-Key": apiKey } : {};
}

export function walletAddressHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const wallet = window.localStorage.getItem(WALLET_STORAGE_KEY)?.trim();
  return wallet ? { "X-Wallet-Address": wallet } : {};
}

export function sanitizeApiErrorMessage(message: unknown, fallback = "Request failed"): string {
  if (typeof message !== "string" || message.trim().length === 0) return fallback;
  return message
    .replace(/nxrwa_[A-Za-z0-9._~-]+/g, "[redacted-api-key]")
    .replace(/(X-API-Key\s*[:=]\s*)([^\s,;]+)/gi, "$1[redacted]");
}
