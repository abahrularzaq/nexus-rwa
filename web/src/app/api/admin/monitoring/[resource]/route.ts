import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";
const ALLOWED_RESOURCES = new Set(["health-checks", "source-health", "review-tasks", "sync-logs", "sources", "repair-logs"]);

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const adminKey = request.headers.get("x-admin-key")?.trim();

  if (!ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_MONITORING_RESOURCE",
          message: `Unsupported monitoring resource: ${resource}`,
        },
      },
      { status: 400 },
    );
  }

  if (!adminKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_ADMIN_KEY",
          message: "Missing X-Admin-Key header",
        },
      },
      { status: 401 },
    );
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${apiBase()}/v1/admin/monitoring/${resource}`);

  for (const key of ["limit", "assetSlug", "status"]) {
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
          code: "UPSTREAM_MONITORING_UNREACHABLE",
          message:
            error instanceof Error
              ? `Monitoring API unreachable from Next.js server: ${error.message}`
              : "Monitoring API unreachable from Next.js server",
          upstreamUrl: upstreamUrl.toString(),
        },
      },
      { status: 502 },
    );
  }
}
