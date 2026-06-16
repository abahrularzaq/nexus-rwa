import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const specPath = join(process.cwd(), "..", "docs", "openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  return new Response(spec, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
