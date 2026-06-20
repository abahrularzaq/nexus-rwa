import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "nexus_admin_session";
const ADMIN_SESSION_TTL_MS = 15 * 60 * 1000;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AdminSession = {
  adminKey: string;
  expiresAt: number;
};

const sessions = new Map<string, AdminSession>();

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

function isDevAdminKeyFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN_KEY === "true";
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name || valueParts.length === 0) continue;
    cookies.set(name, decodeURIComponent(valueParts.join("=")));
  }

  return cookies;
}

function sessionCookie(token: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function pruneExpiredSessions(now = Date.now()): void {
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

export async function createAdminSession(adminKey: string): Promise<Response> {
  const key = adminKey.trim();
  if (!key) {
    return NextResponse.json({ success: false, error: { code: "MISSING_ADMIN_KEY", message: "Admin key is required" } }, { status: 400 });
  }

  const upstream = await fetch(`${apiBase()}/v1/admin/monitoring/overview`, {
    method: "GET",
    headers: { Accept: "application/json", "X-Admin-Key": key },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid admin key" } }, { status: 401 });
  }

  pruneExpiredSessions();
  const token = randomUUID();
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  sessions.set(token, { adminKey: key, expiresAt });

  return NextResponse.json(
    { success: true, data: { expiresAt: new Date(expiresAt).toISOString(), ttlSeconds: ADMIN_SESSION_TTL_MS / 1000 } },
    { status: 200, headers: { "Set-Cookie": sessionCookie(token, ADMIN_SESSION_TTL_MS / 1000), "Cache-Control": "no-store" } },
  );
}

export function destroyAdminSession(request: Request): Response {
  const token = parseCookies(request.headers.get("cookie")).get(ADMIN_SESSION_COOKIE);
  if (token) sessions.delete(token);
  return NextResponse.json({ success: true }, { headers: { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" } });
}

export function resolveAdminKey(request: Request): string | null {
  pruneExpiredSessions();
  const token = parseCookies(request.headers.get("cookie")).get(ADMIN_SESSION_COOKIE);
  if (token) {
    const session = sessions.get(token);
    if (session && session.expiresAt > Date.now()) return session.adminKey;
    sessions.delete(token);
  }

  if (isDevAdminKeyFallbackEnabled()) {
    return request.headers.get("x-admin-key")?.trim() || null;
  }

  return null;
}

export function missingAdminSessionResponse(): Response {
  return NextResponse.json(
    { success: false, error: { code: "MISSING_ADMIN_SESSION", message: "Start an admin session before using admin endpoints" } },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
