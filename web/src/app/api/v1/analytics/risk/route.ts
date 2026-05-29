import type { NextRequest } from "next/server";

import { handleAnalyticsGet } from "@/lib/analytics-route";

export async function GET(req: NextRequest) {
  return handleAnalyticsGet(req, "risk", "/api/v1/analytics/risk");
}
