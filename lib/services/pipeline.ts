import { randomUUID } from "node:crypto";

import type { AuthenticatedUserSeed } from "@/lib/auth";
import { getPool, sql } from "@/lib/db";
import { defaultProfile } from "@/lib/defaults";
import { isDatabaseConfigured } from "@/lib/env";
import { getDashboardData, getProfile, insertJobRun, updateJobRun } from "@/lib/queries";
import { getDigestSchemaInfo, mapSourceSlugToLegacyArticleType } from "@/lib/schema";
import { buildEmailPreview, sendDigestEmailToRecipient } from "@/lib/services/email";
import { ingestRssSource, ingestYoutubeSource } from "@/lib/services/feeds";
import { curateDigests, generateDigest } from "@/lib/services/openai";
import type { ArticleRecord, DigestRecord, PipelineStage, SourceRecord } from "@/lib/types";

async function persistArticles(records: ArticleRecord[]) {
  if (!isDatabaseConfigured() || !records.length) {
    return;
  }

  for (const record of records) {
    await sql(
      `
        insert into articles (
          id, source_slug, source_type, external_id, title, url, description, published_at, raw_content, content_status
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        on conflict (id) do update set
          title = excluded.title,
          url = excluded.url,
          description = excluded.description,
          published_at = excluded.published_at,
          raw_content = excluded.raw_content,
          content_status = excluded.content_status,
          updated_at = now()
      `,
      [
        record.id,
        record.sourceSlug,
        record.sourceType,
        record.externalId,
        record.title,
        record.url,
        record.description,
        record.publishedAt,
        record.rawContent,
        record.contentStatus
      ]
    );
  }
}

async function getActiveSources(): Promise<SourceRecord[]> {
  if (!isDatabaseConfigured()) {
    const data = await getDashboardData();
    return data.sources.filter((source) => source.isActive);
  }

  const result = await sql<Record<string, unknown>>(
    "select slug, label, description, kind, url, is_active from sources where is_active = true order by label asc"
  );

  return result.rows.map((row) => ({
    slug: String(row.slug),
    label: String(row.label),
    description: String(row.description),
    kind: row.kind === "youtube" ? "youtube" : "rss",
    url: String(row.url),
    isActive: Boolean(row.is_active)
  }));
}

async function runIngest(hours: number) {
  const sources = await getActiveSources();
  const articleGroups = await Promise.all(
    sources.map((source) => (source.kind === "youtube" ? ingestYoutubeSource(source, hours) : ingestRssSource(source, hours)))
  );

  const records = articleGroups.flat();
  await persistArticles(records);

  return {
    sources: sources.length,
    articles: records.length
  };
}

async function getArticlesNeedingDigests(limit = 20) {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await sql<Record<string, unknown>>(
    `
      select a.*
      from articles a
      left join digests d on d.article_id = a.id
      where d.id is null and a.content_status in ('ready', 'pending')
      order by a.published_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows.map<ArticleRecord>((row) => ({
    id: String(row.id),
    sourceSlug: String(row.source_slug),
    sourceType: String(row.source_type),
    externalId: String(row.external_id),
    title: String(row.title),
    url: String(row.url),
    description: String(row.description ?? ""),
    publishedAt: new Date(String(row.published_at)).toISOString(),
    rawContent: String(row.raw_content ?? ""),
    contentStatus: String(row.content_status) as ArticleRecord["contentStatus"]
  }));
}

async function persistDigests(digests: DigestRecord[]) {
  if (!isDatabaseConfigured() || !digests.length) {
    return;
  }

  const schema = await getDigestSchemaInfo();

  for (const digest of digests) {
    if (schema.hasGeneratedTitle) {
      await sql(
        `
          insert into digests (id, article_id, generated_title, summary, created_at)
          values ($1,$2,$3,$4,$5)
          on conflict (id) do update set
            generated_title = excluded.generated_title,
            summary = excluded.summary
        `,
        [digest.id, digest.articleId, digest.title, digest.summary, digest.createdAt]
      );
      continue;
    }

    await sql(
      `
        insert into digests (id, article_type, article_id, url, title, summary, created_at)
        values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (id) do update set
          title = excluded.title,
          summary = excluded.summary,
          url = excluded.url
      `,
      [
        digest.id,
        mapSourceSlugToLegacyArticleType(digest.sourceSlug),
        digest.articleId,
        digest.url,
        digest.title,
        digest.summary,
        digest.createdAt
      ]
    );
  }
}

async function runDigest() {
  const pendingArticles = await getArticlesNeedingDigests();
  const digests = await Promise.all(pendingArticles.map((article) => generateDigest(article)));
  await persistDigests(digests);

  return {
    pending: pendingArticles.length,
    generated: digests.length
  };
}

async function getDigestRecords(limit = 30) {
  if (!isDatabaseConfigured()) {
    const data = await getDashboardData();
    return data.digests.map<DigestRecord>((digest) => ({
      id: digest.id,
      articleId: digest.id,
      sourceSlug: digest.sourceSlug,
      title: digest.title,
      summary: digest.summary,
      url: digest.url,
      createdAt: new Date().toISOString(),
      publishedAt: digest.publishedAt
    }));
  }

  const schema = await getDigestSchemaInfo();
  const titleSelect = schema.hasGeneratedTitle ? "d.generated_title as digest_title" : "d.title as digest_title";

  const result = await sql<Record<string, unknown>>(
    `
      select d.id, d.article_id, ${titleSelect}, d.summary, d.created_at, a.source_slug, a.url, a.published_at
      from digests d
      inner join articles a on a.id = d.article_id
      order by a.published_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows.map<DigestRecord>((row) => ({
    id: String(row.id),
    articleId: String(row.article_id),
    sourceSlug: String(row.source_slug),
    title: String(row.digest_title),
    summary: String(row.summary),
    url: String(row.url),
    createdAt: new Date(String(row.created_at)).toISOString(),
    publishedAt: new Date(String(row.published_at)).toISOString()
  }));
}

async function persistEmailRun(
  preview: ReturnType<typeof buildEmailPreview>,
  sendResult: Awaited<ReturnType<typeof sendDigestEmailToRecipient>>,
  clerkUserId?: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await sql(
    `
      insert into email_runs (
        id, clerk_user_id, subject, greeting, introduction, body_html, body_markdown, status, provider_message_id, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `,
    [
      randomUUID(),
      clerkUserId ?? null,
      preview.subject,
      preview.greeting,
      preview.introduction,
      preview.html,
      preview.markdown,
      sendResult.sent ? "sent" : sendResult.previewOnly ? "preview" : "failed",
      sendResult.providerMessageId,
      preview.generatedAt
    ]
  );
}

async function runCurationAndEmailForProfile(profile: typeof defaultProfile, clerkUserId?: string | null) {
  const digests = await getDigestRecords();
  const curated = await curateDigests(digests, profile);
  const preview = buildEmailPreview(profile, curated);
  const sendResult = await sendDigestEmailToRecipient(preview, profile.deliveryEmail || null);
  await persistEmailRun(preview, sendResult, clerkUserId);

  return {
    curated: curated.length,
    emailed: sendResult.sent,
    previewOnly: sendResult.previewOnly,
    emailError: sendResult.error ?? null
  };
}

async function runCurationAndEmailForUser(user: AuthenticatedUserSeed) {
  const profile = await getProfile(user);
  const recipientEmail = user.email || profile.deliveryEmail || null;
  const effectiveProfile = {
    ...profile,
    deliveryEmail: recipientEmail ?? profile.deliveryEmail
  };
  const digests = await getDigestRecords();
  const curated = await curateDigests(digests, effectiveProfile);
  const preview = buildEmailPreview(effectiveProfile, curated);
  const sendResult = await sendDigestEmailToRecipient(preview, recipientEmail);
  await persistEmailRun(preview, sendResult, user.userId);

  return {
    curated: curated.length,
    emailed: sendResult.sent,
    previewOnly: sendResult.previewOnly,
    recipientEmail,
    emailError: sendResult.error ?? null
  };
}

async function getProfilesForDelivery() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await sql<Record<string, unknown>>(
    `
      select *
      from profiles
      where coalesce(delivery_email, '') <> ''
        and clerk_user_id is not null
      order by created_at asc
    `
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    clerkUserId: row.clerk_user_id ? String(row.clerk_user_id) : null,
    name: String(row.name),
    title: String(row.title),
    background: String(row.background),
    expertiseLevel: String(row.expertise_level),
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : defaultProfile.interests,
    preferences: (row.preferences as Record<string, boolean>) ?? defaultProfile.preferences,
    deliveryEmail: String(row.delivery_email ?? ""),
    digestWindowHours: Number(row.digest_window_hours ?? 24),
    topN: Number(row.top_n ?? 10)
  }));
}

export async function runPipeline(
  stage: PipelineStage,
  trigger = "manual",
  options?: { user?: AuthenticatedUserSeed }
) {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const userId = options?.user?.userId ?? null;

  await insertJobRun({
    id: runId,
    clerkUserId: userId,
    stage,
    status: "running",
    trigger,
    summary: {},
    error: null,
    startedAt,
    finishedAt: null
  });

  try {
    const summary =
      stage === "ingest"
        ? await runIngest(defaultProfile.digestWindowHours)
        : stage === "digest"
          ? await runDigest()
          : stage === "curate"
            ? options?.user
              ? await runCurationAndEmailForUser(options.user)
              : await runCurationAndEmailForProfile((await getProfile(options?.user)) ?? defaultProfile, userId)
            : stage === "email"
              ? options?.user
                ? await runCurationAndEmailForUser(options.user)
                : {
                    profilesProcessed: (
                      await Promise.all(
                        (await getProfilesForDelivery()).map((profile) =>
                          runCurationAndEmailForProfile(profile, profile.clerkUserId ?? null)
                        )
                      )
                    ).length
                  }
              : {
                  ...(await runIngest(defaultProfile.digestWindowHours)),
                  ...(await runDigest()),
                  ...(options?.user
                    ? await runCurationAndEmailForUser(options.user)
                    : await runCurationAndEmailForProfile((await getProfile(options?.user)) ?? defaultProfile, userId))
                };

    await updateJobRun(runId, "success", summary);

    return {
      ok: true,
      runId,
      summary
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline failure";
    await updateJobRun(runId, "failed", {}, message);

    return {
      ok: false,
      runId,
      error: message
    };
  }
}

export async function initializeDatabaseIfPossible() {
  const pool = getPool();
  if (!pool) {
    return false;
  }

  await pool.query("select 1");
  return true;
}
