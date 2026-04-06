import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_TO: z.string().email().optional(),
  ADMIN_ACCESS_TOKEN: z.string().optional(),
  YOUTUBE_CHANNELS: z.string().optional()
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_TO: process.env.EMAIL_TO,
  ADMIN_ACCESS_TOKEN: process.env.ADMIN_ACCESS_TOKEN,
  YOUTUBE_CHANNELS: process.env.YOUTUBE_CHANNELS
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;

export function isDatabaseConfigured() {
  return Boolean(env.DATABASE_URL);
}

export function getConfiguredYoutubeChannels() {
  return (env.YOUTUBE_CHANNELS ?? "UCawZsQWqfGSbCI5yjkdVkTA")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
