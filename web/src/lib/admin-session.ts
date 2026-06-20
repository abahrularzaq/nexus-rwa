import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "nexus_admin_session";
const ADMIN_SESSION_TTL_MS = 15 * 60 * 1000;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const DEV_ADMIN_SESSION_SECRET = "nexus-rwa-dev-admin-session-secret";

type AdminSessionPayload = {
  adminKey: string;
  expiresAt: number;
};

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

function base64UrlEncode(value: Buffer): string {
  return value.toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function adminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production for admin session cookies.");
  }

  return DEV_ADMIN_SESSION_SECRET;
}

function encryptionKey(): Buffer {
  return scryptSync(adminSessionSecret(), "nexus-rwa-admin-session-v1", 32);
}

function encryptSessionPayload(payload: AdminSessionPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    base64UrlEncode(iv),
    base64UrlEncode(tag),
    base64UrlEncode(ciphertext),
  ].join(".");
}

function decryptSessionPayload(cookieValue: string): AdminSessionPayload | null {
  const [ivValue, tagValue, ciphertextValue] = cookieValue.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) return null;

  try {
    const iv = base64UrlDecode(ivValue);
    const tag = base64UrlDecode(tagValue);
    const ciphertext = base64UrlDecode(ciphertextValue);

    if (tag.length !== 16) return null;

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(plaintext) as Partial<AdminSessionPayload>;
    if (typeof payload.adminKey !== "string" || typeof payload.expiresAt !== "number") return null;
    if (!payload.adminKey.trim() || !Number.isFinite(payload.expiresAt)) return null;

    return { adminKey: payload.adminKey, expiresAt: payload.expiresAt };
  } catch {
    return null;
  }
}

function sessionCookie(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function getSessionPayload(request: Request): AdminSessionPayload | null {
  const cookieValue = parseCookies(request.headers.get("cookie")).get(ADMIN_SESSION_COOKIE);
  if (!cookieValue) return null;

  const payload = decryptSessionPayload(cookieValue);
  if (!payload || payload.expiresAt <= Date.now()) return null;

  return payload;
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

  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const token = encryptSessionPayload({ adminKey: key, expiresAt });

  return NextResponse.json(
    { success: true, data: { active: true, expiresAt: new Date(expiresAt).toISOString(), ttlSeconds: ADMIN_SESSION_TTL_MS / 1000 } },
    { status: 200, headers: { "Set-Cookie": sessionCookie(token, ADMIN_SESSION_TTL_MS / 1000), "Cache-Control": "no-store" } },
  );
}

export function destroyAdminSession(): Response {
  return NextResponse.json({ success: true }, { headers: { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" } });
}

export function getAdminSessionStatus(request: Request): Response {
  const payload = getSessionPayload(request);
  const data = payload
    ? { active: true, expiresAt: new Date(payload.expiresAt).toISOString() }
    : { active: false };

  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
}

export function resolveAdminKey(request: Request): string | null {
  const payload = getSessionPayload(request);
  if (payload) return payload.adminKey;

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
