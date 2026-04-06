import { defaultProfile, defaultSources } from "@/lib/defaults";
import type { DashboardData } from "@/lib/types";

export const sampleDashboardData: DashboardData = {
  metrics: {
    totalSources: defaultSources.length,
    articlesLast24h: 12,
    digestsReady: 8,
    lastRunStatus: "success"
  },
  digests: [
    {
      id: "sample-1",
      title: "OpenAI tightens enterprise reasoning stack",
      summary:
        "A new set of platform changes focuses on controllable reasoning and enterprise-grade reliability. The story matters because it shifts the conversation from model novelty to deployable operational quality.",
      url: "https://openai.com/news",
      sourceSlug: "openai-news",
      rank: 1,
      relevanceScore: 9.6,
      reasoning: "Strong production relevance and direct alignment with infrastructure interests.",
      publishedAt: new Date().toISOString()
    },
    {
      id: "sample-2",
      title: "Anthropic explores safety and eval rigor",
      summary:
        "Anthropic highlights concrete evaluation and alignment practices rather than general product messaging. It is useful because it gives deployers more signal on how frontier systems are being stress-tested.",
      url: "https://www.anthropic.com/news",
      sourceSlug: "anthropic-news",
      rank: 2,
      relevanceScore: 9.2,
      reasoning: "Relevant to safety and benchmarking themes in the profile.",
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ],
  recentJobs: [
    {
      id: "job-sample-1",
      stage: "full",
      status: "success",
      trigger: "sample",
      summary: { ingested: 12, digested: 8, curated: 8 },
      error: null,
      startedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString()
    },
    {
      id: "job-sample-2",
      stage: "email",
      status: "success",
      trigger: "sample",
      summary: { sent: false, previewOnly: true },
      error: null,
      startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString()
    }
  ],
  sources: defaultSources,
  profile: {
    ...defaultProfile,
    deliveryEmail: "operator@example.com"
  },
  emailPreview: {
    subject: "Daily AI News Desk | April 05, 2026",
    greeting: "Hey Dave, your AI desk is ready.",
    introduction:
      "Today's strongest stories cluster around production reliability, evaluation rigor, and practical deployment patterns. The shortlist below is ranked against your profile and tuned for technical depth over hype.",
    html: "<p>Preview content available after the first live run.</p>",
    markdown: "Preview content available after the first live run.",
    generatedAt: new Date().toISOString()
  },
  databaseConfigured: false
};
