import * as cheerio from "cheerio";
import Parser from "rss-parser";
import { YoutubeTranscript } from "youtube-transcript";

import { getConfiguredYoutubeChannels } from "@/lib/env";
import { slugify } from "@/lib/format";
import type { ArticleRecord, SourceRecord } from "@/lib/types";

const parser = new Parser();

type FeedItem = {
  title?: string;
  link?: string;
  id?: string;
  guid?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
};

async function fetchRssFeed(url: string) {
  return parser.parseURL(url);
}

async function extractReadableText(url: string) {
  const response = await fetch(url, { next: { revalidate: 0 } });
  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header").remove();
  const text = $("article").text() || $("main").text() || $("body").text();
  return text.replace(/\s+/g, " ").trim().slice(0, 16000);
}

function buildArticleRecord(item: FeedItem, source: SourceRecord, rawContent: string) {
  const url = item.link ?? "";
  const externalId = item.guid ?? item.id ?? url;
  return {
    id: `${source.slug}:${externalId}`,
    sourceSlug: source.slug,
    sourceType: source.kind,
    externalId,
    title: item.title ?? "Untitled article",
    url,
    description: item.contentSnippet ?? "",
    publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    rawContent,
    contentStatus: rawContent ? "ready" : "pending"
  } satisfies ArticleRecord;
}

export async function ingestRssSource(source: SourceRecord, hours = 24) {
  const feed = await fetchRssFeed(source.url);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const items = (feed.items as FeedItem[]).filter((item) => {
    const published = item.isoDate ?? item.pubDate;
    return published ? new Date(published).getTime() >= cutoff : true;
  });

  const records = await Promise.all(
    items.map(async (item) => {
      const rawContent = source.slug.includes("anthropic")
        ? await extractReadableText(item.link ?? "")
        : (item.contentSnippet ?? item.content ?? "").replace(/\s+/g, " ").trim().slice(0, 16000);

      return buildArticleRecord(item, source, rawContent);
    })
  );

  return records;
}

function extractVideoId(url: string) {
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1]?.split("&")[0] ?? url;
  }

  if (url.includes("/shorts/")) {
    return url.split("/shorts/")[1]?.split("?")[0] ?? url;
  }

  return url;
}

export async function ingestYoutubeSource(source: SourceRecord, hours = 24) {
  const feed = await fetchRssFeed(source.url);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const items = (feed.items as FeedItem[]).filter((item) => {
    const published = item.isoDate ?? item.pubDate;
    return published ? new Date(published).getTime() >= cutoff : true;
  });

  const records = await Promise.all(
    items.map(async (item) => {
      const url = item.link ?? "";
      const videoId = extractVideoId(url);
      let transcriptText = "";

      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        transcriptText = transcript.map((entry) => entry.text).join(" ").slice(0, 16000);
      } catch {
        transcriptText = (item.contentSnippet ?? "").slice(0, 4000);
      }

      return {
        id: `${source.slug}:${videoId}`,
        sourceSlug: source.slug,
        sourceType: source.kind,
        externalId: videoId,
        title: item.title ?? "Untitled video",
        url,
        description: item.contentSnippet ?? "",
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        rawContent: transcriptText,
        contentStatus: transcriptText ? "ready" : "unavailable"
      } satisfies ArticleRecord;
    })
  );

  return records;
}

export function buildYoutubeSources() {
  return getConfiguredYoutubeChannels().map((channelId) => ({
    slug: slugify(channelId),
    label: `YouTube ${channelId}`,
    description: "Custom YouTube channel source from env configuration.",
    kind: "youtube" as const,
    url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    isActive: true
  }));
}
