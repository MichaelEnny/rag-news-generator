import { NextResponse } from "next/server";

import { initializeDatabaseIfPossible } from "@/lib/services/pipeline";

export async function GET() {
  const connected = await initializeDatabaseIfPossible().catch(() => false);
  return NextResponse.json({
    ok: true,
    database: connected
  });
}
