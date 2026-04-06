import { NextResponse } from "next/server";

import { assertCronSecret } from "@/lib/security";
import { runPipeline } from "@/lib/services/pipeline";

export async function GET(request: Request) {
  try {
    assertCronSecret(request.headers.get("authorization"));
    const result = await runPipeline("ingest", "cron");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }
}
