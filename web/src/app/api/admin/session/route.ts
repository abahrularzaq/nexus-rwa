import { createAdminSession, destroyAdminSession, getAdminSessionStatus } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return createAdminSession(typeof body.adminKey === "string" ? body.adminKey : "");
}

export async function GET(request: Request) {
  return getAdminSessionStatus(request);
}

export async function DELETE() {
  return destroyAdminSession();
}
