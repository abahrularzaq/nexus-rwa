import { NextResponse } from "next/server";
import { resolveAdminKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// Compatibility alias for older clients. Dashboard code uses
// /api/admin/monitoring/overview as the canonical Next.js proxy route.
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

export async function GET(request: Request) {
  const adminKey = resolveAdminKey(request);
  const upstreamUrl = `${apiBase()}/v1/admin/monitoring/overview`;

  if (!adminKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_ADMIN_SESSION",
          message: "Start an admin session before using admin endpoints",
        },
      },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Admin-Key": adminKey,
      },
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_MONITORING_UNREACHABLE",
          message:
            error instanceof Error
              ? `Monitoring API unreachable from Next.js server: ${error.message}`
              : "Monitoring API unreachable from Next.js server",
          upstreamUrl,
        },
      },
      { status: 502 },
    );
  }
}
