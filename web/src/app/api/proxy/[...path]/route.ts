import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sanitizeApiErrorMessage } from "@/lib/security/api-key";

const SENSITIVE_PATHS = [
  /^v1\/assets\/[^/]+\/full$/,
  /^v1\/assets\/[^/]+\/history$/,
  /^v1\/assets\/[^/]+\/risk$/,
  /^v1\/assets\/[^/]+\/sources$/,
  /^v1\/assets\/[^/]+\/insight$/,
  /^v1\/analytics\/bulk$/,
  /^v1\/export$/,
  /^v1\/ask$/,
];

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").trim().replace(/\/$/, "");
}

function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some((pattern) => pattern.test(path));
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await context.params;
  const path = pathParts.join("/");

  if (!isSensitivePath(path)) {
    return NextResponse.json({ success: false, error: "Proxy route is restricted to sensitive API endpoints." }, { status: 404 });
  }

  const upstreamUrl = new URL(`${apiBase()}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  const headers = new Headers({ Accept: "application/json" });
  const wallet = request.headers.get("X-Wallet-Address") ?? request.cookies.get("nexus_wallet_address")?.value;
  const session = request.cookies.get("nexus_session")?.value;

  if (wallet) headers.set("X-Wallet-Address", wallet);
  if (session) headers.set("Cookie", `nexus_session=${session}`);
  if (request.method !== "GET" && request.headers.get("content-type")) {
    headers.set("Content-Type", request.headers.get("content-type") as string);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const safeText = sanitizeApiErrorMessage(text, text);

  return new NextResponse(safeText, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

export const GET = proxy;
export const POST = proxy;
