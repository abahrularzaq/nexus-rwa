import { NextResponse } from "next/server";
import { resolveAdminKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3001";
const ALLOWED_RESOURCES = new Set(["health-checks", "review-tasks"]);

function apiBase(): string {
  return API_URL.trim().replace(/\/$/, "");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await params;
  const adminKey = resolveAdminKey(request);

  if (!ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_MONITORING_RESOURCE",
          message: `Unsupported assignment action for monitoring resource: ${resource}`,
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
          code: "MISSING_ADMIN_SESSION",
          message: "Start an admin session before using admin endpoints",
        },
      },
      { status: 401 },
    );
  }

  const upstreamUrl = `${apiBase()}/v1/admin/monitoring/${resource}/${encodeURIComponent(id)}/assignment`;

  try {
    const requestBody = await request.text();
    const upstream = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        "X-Admin-Key": adminKey,
      },
      body: requestBody || undefined,
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
