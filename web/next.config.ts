import type { NextConfig } from "next";

function originFromUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const apiOrigin = originFromUrl(process.env.NEXT_PUBLIC_API_URL);
const appOrigin = originFromUrl(process.env.NEXT_PUBLIC_APP_URL);
const baseMainnetRpcOrigin = originFromUrl(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL);
const baseSepoliaRpcOrigin = originFromUrl(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL);

const connectSources = [
  "'self'",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "https://api.nexusrwa.xyz",
  apiOrigin,
  appOrigin,
  baseMainnetRpcOrigin,
  baseSepoliaRpcOrigin,
  "https://*.walletconnect.com",
  "https://*.walletconnect.org",
  "wss://*.walletconnect.com",
  "wss://*.walletconnect.org",
  "https://*.coinbase.com",
  "https://*.coinbasewallet.com",
  "https://*.rainbow.me",
].filter((source): source is string => Boolean(source));

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src ${Array.from(new Set(connectSources)).join(" ")}`,
  "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://*.walletconnect.com https://*.walletconnect.org https://*.coinbase.com https://*.coinbasewallet.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), clipboard-read=(self), clipboard-write=(self)",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
