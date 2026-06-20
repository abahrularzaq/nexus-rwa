import { NextResponse } from "next/server";
import { resolveAdminKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

export async function GET(request: Request) {
  const adminKey = resolveAdminKey(request);

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

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${apiBase()}/v1/admin/usage/summary`);

  for (const key of ["days", "limit"]) {
    const value = incomingUrl.searchParams.get(key);
    if (value) upstreamUrl.searchParams.set(key, value);
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
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
          code: "UPSTREAM_USAGE_UNREACHABLE",
          message:
            error instanceof Error
              ? `Usage API unreachable from Next.js server: ${error.message}`
              : "Usage API unreachable from Next.js server",
          upstreamUrl: upstreamUrl.toString(),
        },
      },
      { status: 502 },
    );
  }
}
