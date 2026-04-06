import type { AuthenticatedUserSeed } from "@/lib/auth";
import { defaultProfile, defaultSources } from "@/lib/defaults";
import { isDatabaseConfigured } from "@/lib/env";
import { sampleDashboardData } from "@/lib/sample-data";
import { getDigestSchemaInfo, mapSourceSlugToLegacyArticleType } from "@/lib/schema";
import type {
  DashboardData,
  DigestRecord,
  EmailPreview,
  JobRunRecord,
  ProfileRecord,
  SourceRecord
} from "@/lib/types";
import { sql } from "@/lib/db";

async function withDatabaseFallback<T>(query: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await query();
  } catch (error) {
    console.error("Database read failed; using fallback data.", error);
    return fallback();
  }
}

function parseProfile(row: Record<string, unknown>): ProfileRecord {
  return {
    id: String(row.id),
    clerkUserId: row.clerk_user_id ? String(row.clerk_user_id) : null,
    name: String(row.name),
    title: String(row.title),
    background: String(row.background),
    expertiseLevel: String(row.expertise_level),
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : defaultProfile.interests,
    preferences:
      row.preferences && typeof row.preferences === "object"
        ? (row.preferences as Record<string, boolean>)
        : defaultProfile.preferences,
    deliveryEmail: String(row.delivery_email ?? ""),
    digestWindowHours: Number(row.digest_window_hours ?? defaultProfile.digestWindowHours),
    topN: Number(row.top_n ?? defaultProfile.topN)
  };
}

function buildDefaultProfileForUser(user: AuthenticatedUserSeed): ProfileRecord {
  return {
    ...defaultProfile,
    id: user.userId,
    clerkUserId: user.userId,
    name: user.name || defaultProfile.name,
    deliveryEmail: user.email || defaultProfile.deliveryEmail
  };
}

export async function getProfile(user?: AuthenticatedUserSeed) {
  if (!user) {
    return isDatabaseConfigured() ? defaultProfile : sampleDashboardData.profile;
  }

  if (!isDatabaseConfigured()) {
    return {
      ...sampleDashboardData.profile,
      id: user.userId,
      clerkUserId: user.userId,
      name: user.name || sampleDashboardData.profile.name,
      deliveryEmail: user.email || sampleDashboardData.profile.deliveryEmail
    };
  }

  const result = await withDatabaseFallback(
    () =>
      sql<Record<string, unknown>>(
        "select * from profiles where clerk_user_id = $1 or id = $1 order by created_at asc limit 1",
        [user.userId]
      ),
    () => ({ rows: [] as Record<string, unknown>[] })
  );
  const row = result.rows[0];

  if (row) {
    const profile = parseProfile(row);

    if (!profile.deliveryEmail && user.email) {
      await sql("update profiles set delivery_email = $2, updated_at = now() where id = $1", [profile.id, user.email]);
      return {
        ...profile,
        deliveryEmail: user.email
      };
    }

    return profile;
  }

  const fallback = buildDefaultProfileForUser(user);
  await saveProfile(fallback, user.userId);
  return fallback;
}

export async function getSources() {
  if (!isDatabaseConfigured()) {
    return sampleDashboardData.sources;
  }

  const result = await withDatabaseFallback(
    () =>
      sql<Record<string, unknown>>(
        "select slug, label, description, kind, url, is_active, last_checked_at from sources order by label asc"
      ),
    () => ({ rows: [] as Record<string, unknown>[] })
  );

  if (!result.rows.length) {
    return defaultSources;
  }

  return result.rows.map<SourceRecord>((row) => ({
    slug: String(row.slug),
    label: String(row.label),
    description: String(row.description),
    kind: row.kind === "youtube" ? "youtube" : "rss",
    url: String(row.url),
    isActive: Boolean(row.is_active),
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : null
  }));
}

export async function getRecentJobs(userId?: string, limit = 6) {
  if (!userId) {
    return isDatabaseConfigured() ? [] : sampleDashboardData.recentJobs;
  }

  if (!isDatabaseConfigured()) {
    return sampleDashboardData.recentJobs;
  }

  const result = await withDatabaseFallback(
    () =>
      sql<Record<string, unknown>>(
        "select * from job_runs where clerk_user_id = $1 or clerk_user_id is null order by started_at desc limit $2",
        [userId, limit]
      ),
    () => ({ rows: [] as Record<string, unknown>[] })
  );

  return result.rows.map<JobRunRecord>((row) => ({
    id: String(row.id),
    clerkUserId: row.clerk_user_id ? String(row.clerk_user_id) : null,
    stage: String(row.stage) as JobRunRecord["stage"],
    status: String(row.status) as JobRunRecord["status"],
    trigger: String(row.trigger),
    summary: (row.summary as Record<string, unknown>) ?? {},
    error: row.error ? String(row.error) : null,
    startedAt: new Date(String(row.started_at)).toISOString(),
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null
  }));
}

export async function getRecentDigests(limit = 12) {
  if (!isDatabaseConfigured()) {
    return sampleDashboardData.digests;
  }

  const schema = await getDigestSchemaInfo().catch(() => ({ hasGeneratedTitle: true }));
  const titleSelect = schema.hasGeneratedTitle ? "d.generated_title as digest_title" : "d.title as digest_title";

  const result = await withDatabaseFallback(
    () =>
      sql<Record<string, unknown>>(
        `
          select
            d.id,
            d.summary,
            ${titleSelect},
            d.created_at,
            a.url,
            a.source_slug,
            a.published_at
          from digests d
          inner join articles a on a.id = d.article_id
          order by a.published_at desc
          limit $1
        `,
        [limit]
      ),
    () =>
      ({
        rows: sampleDashboardData.digests.map((digest) => ({
          id: digest.id,
          digest_title: digest.title,
          summary: digest.summary,
          url: digest.url,
          source_slug: digest.sourceSlug,
          published_at: digest.publishedAt
        }))
      }) as { rows: Record<string, unknown>[] }
  );

  return result.rows.map((row, index) => ({
    id: String(row.id),
    title: String(row.digest_title),
    summary: String(row.summary),
    url: String(row.url),
    sourceSlug: String(row.source_slug),
    rank: index + 1,
    relevanceScore: Math.max(5, 10 - index * 0.3),
    reasoning: "Ranked by recency until a personalized curation run is available.",
    publishedAt: new Date(String(row.published_at)).toISOString()
  }));
}

export async function getLatestEmailPreview(userId?: string) {
  if (!userId) {
    return isDatabaseConfigured() ? null : sampleDashboardData.emailPreview;
  }

  if (!isDatabaseConfigured()) {
    return sampleDashboardData.emailPreview;
  }

  const result = await withDatabaseFallback(
    () =>
      sql<Record<string, unknown>>(
        "select subject, greeting, introduction, body_html, body_markdown, created_at from email_runs where clerk_user_id = $1 order by created_at desc limit 1",
        [userId]
      ),
    () => ({ rows: [] as Record<string, unknown>[] })
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    subject: String(row.subject),
    greeting: String(row.greeting),
    introduction: String(row.introduction),
    html: String(row.body_html),
    markdown: String(row.body_markdown),
    generatedAt: new Date(String(row.created_at)).toISOString()
  } satisfies EmailPreview;
}

export async function getDashboardData(user?: AuthenticatedUserSeed): Promise<DashboardData> {
  if (!user) {
    return isDatabaseConfigured() ? sampleDashboardData : sampleDashboardData;
  }

  if (!isDatabaseConfigured()) {
    return {
      ...sampleDashboardData,
      profile: {
        ...sampleDashboardData.profile,
        id: user.userId,
        clerkUserId: user.userId,
        name: user.name || sampleDashboardData.profile.name,
        deliveryEmail: user.email || sampleDashboardData.profile.deliveryEmail
      }
    };
  }

  const [profile, sources, digests, recentJobs, emailPreview, metrics] = await Promise.all([
    getProfile(user),
    getSources(),
    getRecentDigests(),
    getRecentJobs(user.userId),
    getLatestEmailPreview(user.userId),
    getDashboardMetrics()
  ]);

  return {
    metrics,
    digests,
    recentJobs,
    sources,
    profile,
    emailPreview,
    databaseConfigured: true
  };
}

export async function getDashboardMetrics() {
  if (!isDatabaseConfigured()) {
    return sampleDashboardData.metrics;
  }

  try {
    const [sourcesResult, articlesResult, digestsResult, lastRunResult] = await Promise.all([
      sql<{ count: string }>("select count(*) from sources where is_active = true"),
      sql<{ count: string }>("select count(*) from articles where published_at >= now() - interval '24 hours'"),
      sql<{ count: string }>("select count(*) from digests"),
      sql<{ status: string }>("select status from job_runs order by started_at desc limit 1")
    ]);

    return {
      totalSources: Number(sourcesResult.rows[0]?.count ?? 0),
      articlesLast24h: Number(articlesResult.rows[0]?.count ?? 0),
      digestsReady: Number(digestsResult.rows[0]?.count ?? 0),
      lastRunStatus: (lastRunResult.rows[0]?.status as DashboardData["metrics"]["lastRunStatus"]) ?? "pending"
    };
  } catch (error) {
    console.error("Database metrics query failed; using sample metrics.", error);
    return sampleDashboardData.metrics;
  }
}

export async function saveProfile(input: ProfileRecord, clerkUserId?: string) {
  if (!clerkUserId) {
    return input;
  }

  const profile = {
    ...input,
    id: clerkUserId,
    clerkUserId
  };

  if (!isDatabaseConfigured()) {
    return profile;
  }

  await sql(
    `
      insert into profiles (
        id, clerk_user_id, name, title, background, expertise_level, interests, preferences, delivery_email, digest_window_hours, top_n
      )
      values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)
      on conflict (id) do update set
        clerk_user_id = excluded.clerk_user_id,
        name = excluded.name,
        title = excluded.title,
        background = excluded.background,
        expertise_level = excluded.expertise_level,
        interests = excluded.interests,
        preferences = excluded.preferences,
        delivery_email = excluded.delivery_email,
        digest_window_hours = excluded.digest_window_hours,
        top_n = excluded.top_n,
        updated_at = now()
    `,
    [
      profile.id,
      profile.clerkUserId,
      profile.name,
      profile.title,
      profile.background,
      profile.expertiseLevel,
      JSON.stringify(profile.interests),
      JSON.stringify(profile.preferences),
      profile.deliveryEmail,
      profile.digestWindowHours,
      profile.topN
    ]
  );

  return profile;
}

export async function setSourceActive(slug: string, isActive: boolean) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await sql("update sources set is_active = $2, updated_at = now() where slug = $1", [slug, isActive]);
}

export async function insertJobRun(job: JobRunRecord) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await sql(
    `
      insert into job_runs (id, clerk_user_id, stage, status, trigger, summary, error, started_at, finished_at)
      values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
    `,
    [
      job.id,
      job.clerkUserId ?? null,
      job.stage,
      job.status,
      job.trigger,
      JSON.stringify(job.summary),
      job.error,
      job.startedAt,
      job.finishedAt
    ]
  );
}

export async function updateJobRun(id: string, status: JobRunRecord["status"], summary: Record<string, unknown>, error?: string) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await sql(
    "update job_runs set status = $2, summary = $3::jsonb, error = $4, finished_at = now() where id = $1",
    [id, status, JSON.stringify(summary), error ?? null]
  );
}

export async function upsertArticles(records: DigestRecord[]) {
  if (!isDatabaseConfigured() || !records.length) {
    return;
  }

  const schema = await getDigestSchemaInfo();

  for (const record of records) {
    if (schema.hasGeneratedTitle) {
      await sql(
        `
          insert into digests (id, article_id, generated_title, summary)
          values ($1,$2,$3,$4)
          on conflict (id) do update set generated_title = excluded.generated_title, summary = excluded.summary
        `,
        [record.id, record.articleId, record.title, record.summary]
      );
      continue;
    }

    await sql(
      `
        insert into digests (id, article_type, article_id, url, title, summary)
        values ($1,$2,$3,$4,$5,$6)
        on conflict (id) do update set title = excluded.title, summary = excluded.summary, url = excluded.url
      `,
      [
        record.id,
        mapSourceSlugToLegacyArticleType(record.sourceSlug),
        record.articleId,
        record.url,
        record.title,
        record.summary
      ]
    );
  }
}
