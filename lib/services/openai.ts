import OpenAI from "openai";

import { env } from "@/lib/env";
import { defaultProfile } from "@/lib/defaults";
import type { ArticleRecord, CurationPreviewItem, DigestRecord, ProfileRecord } from "@/lib/types";

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

function fallbackSummary(content: string) {
  const trimmed = content.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "No detailed content was available for this item, so the digest is awaiting richer source text.";
  }

  const sentence = trimmed.slice(0, 260);
  return `${sentence}${sentence.endsWith(".") ? "" : "."}`;
}

export async function generateDigest(article: ArticleRecord): Promise<DigestRecord> {
  if (!client) {
    return {
      id: article.id,
      articleId: article.id,
      sourceSlug: article.sourceSlug,
      title: article.title,
      summary: fallbackSummary(article.rawContent || article.description),
      url: article.url,
      createdAt: new Date().toISOString(),
      publishedAt: article.publishedAt
    };
  }

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are an expert AI news analyst. Produce a concise title and a 2-3 sentence summary focused on technical substance and practical significance."
      },
      {
        role: "user",
        content: `Title: ${article.title}\nSource: ${article.sourceSlug}\nContent: ${(
          article.rawContent || article.description
        ).slice(0, 12000)}`
      }
    ]
  });

  const text = response.output_text || "";
  const [titleLine, ...rest] = text.split("\n").filter(Boolean);

  return {
    id: article.id,
    articleId: article.id,
    sourceSlug: article.sourceSlug,
    title: titleLine?.replace(/^title:\s*/i, "").trim() || article.title,
    summary: rest.join(" ").trim() || fallbackSummary(article.rawContent || article.description),
    url: article.url,
    createdAt: new Date().toISOString(),
    publishedAt: article.publishedAt
  };
}

export async function curateDigests(digests: DigestRecord[], profile: ProfileRecord = defaultProfile) {
  if (!client) {
    return digests
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map<CurationPreviewItem>((digest, index) => ({
        id: digest.id,
        title: digest.title,
        summary: digest.summary,
        url: digest.url,
        sourceSlug: digest.sourceSlug,
        rank: index + 1,
        relevanceScore: Math.max(5, 10 - index * 0.4),
        reasoning: "Fallback ranking by recency because OpenAI is not configured.",
        publishedAt: digest.publishedAt
      }));
  }

  const profileSummary = [
    `Name: ${profile.name}`,
    `Title: ${profile.title}`,
    `Background: ${profile.background}`,
    `Expertise: ${profile.expertiseLevel}`,
    `Interests: ${profile.interests.join(", ")}`
  ].join("\n");

  const digestPrompt = digests
    .map((digest) => `ID: ${digest.id}\nTitle: ${digest.title}\nSummary: ${digest.summary}\nSource: ${digest.sourceSlug}`)
    .join("\n\n");

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Rank the provided AI news digests for the user profile. Return one item per line in the format ID | score | reasoning."
      },
      {
        role: "user",
        content: `${profileSummary}\n\nDigests:\n${digestPrompt}`
      }
    ]
  });

  const ranked = response.output_text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, scoreText, ...reasoningParts] = line.split("|").map((part) => part.trim());
      const digest = digests.find((candidate) => candidate.id === id);

      if (!digest) {
        return null;
      }

      return {
        id: digest.id,
        title: digest.title,
        summary: digest.summary,
        url: digest.url,
        sourceSlug: digest.sourceSlug,
        rank: 0,
        relevanceScore: Number(scoreText) || 7,
        reasoning: reasoningParts.join(" ") || "Selected for alignment with the user profile.",
        publishedAt: digest.publishedAt
      } satisfies CurationPreviewItem;
    })
    .filter((item): item is CurationPreviewItem => Boolean(item))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return ranked.length
    ? ranked
    : digests.map<CurationPreviewItem>((digest, index) => ({
        id: digest.id,
        title: digest.title,
        summary: digest.summary,
        url: digest.url,
        sourceSlug: digest.sourceSlug,
        rank: index + 1,
        relevanceScore: 7,
        reasoning: "Fallback ranking because the model output was empty.",
        publishedAt: digest.publishedAt
      }));
}
