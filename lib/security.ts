import { env } from "@/lib/env";

export function assertAdminToken(token: FormDataEntryValue | null) {
  if (!env.ADMIN_ACCESS_TOKEN) {
    return;
  }

  const expectedToken = env.ADMIN_ACCESS_TOKEN.trim();
  const providedToken = typeof token === "string" ? token.trim() : "";

  if (!providedToken || providedToken !== expectedToken) {
    throw new Error("Invalid admin access token.");
  }
}

export function assertCronSecret(authHeader: string | null) {
  if (!env.CRON_SECRET) {
    throw new Error("CRON_SECRET is not configured.");
  }

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw new Error("Unauthorized cron request.");
  }
}
