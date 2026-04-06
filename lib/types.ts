export type SourceKind = "rss" | "youtube";
export type ArticleContentStatus = "pending" | "ready" | "unavailable" | "failed";
export type JobStatus = "pending" | "running" | "success" | "failed";
export type PipelineStage = "ingest" | "digest" | "curate" | "email" | "full";

export type SourceRecord = {
  slug: string;
  label: string;
  description: string;
  kind: SourceKind;
  url: string;
  isActive: boolean;
  lastCheckedAt?: string | null;
};

export type ArticleRecord = {
  id: string;
  sourceSlug: string;
  sourceType: string;
  externalId: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  rawContent: string;
  contentStatus: ArticleContentStatus;
};

export type DigestRecord = {
  id: string;
  articleId: string;
  sourceSlug: string;
  title: string;
  summary: string;
  url: string;
  createdAt: string;
  publishedAt: string;
};

export type JobRunRecord = {
  id: string;
  clerkUserId?: string | null;
  stage: PipelineStage | Exclude<PipelineStage, "full">;
  status: JobStatus;
  trigger: string;
  summary: Record<string, unknown>;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type ProfileRecord = {
  id: string;
  clerkUserId?: string | null;
  name: string;
  title: string;
  background: string;
  expertiseLevel: string;
  interests: string[];
  preferences: Record<string, boolean>;
  deliveryEmail: string;
  digestWindowHours: number;
  topN: number;
};

export type CurationPreviewItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceSlug: string;
  rank: number;
  relevanceScore: number;
  reasoning: string;
  publishedAt: string;
};

export type EmailPreview = {
  subject: string;
  greeting: string;
  introduction: string;
  html: string;
  markdown: string;
  generatedAt: string;
};

export type DashboardData = {
  metrics: {
    totalSources: number;
    articlesLast24h: number;
    digestsReady: number;
    lastRunStatus: JobStatus;
  };
  digests: CurationPreviewItem[];
  recentJobs: JobRunRecord[];
  sources: SourceRecord[];
  profile: ProfileRecord;
  emailPreview: EmailPreview | null;
  databaseConfigured: boolean;
};
