import type { ProfileRecord, SourceRecord } from "@/lib/types";

export const defaultSources: SourceRecord[] = [
  {
    slug: "openai-news",
    label: "OpenAI News",
    description: "Official OpenAI announcements from the RSS feed.",
    kind: "rss",
    url: "https://openai.com/news/rss.xml",
    isActive: true
  },
  {
    slug: "anthropic-news",
    label: "Anthropic News",
    description: "Anthropic blog, engineering, and research feed rollup.",
    kind: "rss",
    url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml",
    isActive: true
  },
  {
    slug: "matthew-berman",
    label: "Matthew Berman",
    description: "YouTube creator feed for implementation-focused AI updates.",
    kind: "youtube",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCawZsQWqfGSbCI5yjkdVkTA",
    isActive: true
  }
];

export const defaultProfile: ProfileRecord = {
  id: "default",
  name: "Dave",
  title: "AI Engineer & Researcher",
  background:
    "Experienced AI engineer with deep interest in practical AI applications, research breakthroughs, and production-ready systems.",
  expertiseLevel: "Advanced",
  interests: [
    "Large Language Models and their applications",
    "Retrieval-Augmented Generation systems",
    "AI agent architectures",
    "Multimodal AI",
    "Production AI systems",
    "Research with practical implications"
  ],
  preferences: {
    preferPractical: true,
    preferTechnicalDepth: true,
    preferResearchBreakthroughs: true,
    preferProductionFocus: true,
    avoidMarketingHype: true
  },
  deliveryEmail: "",
  digestWindowHours: 24,
  topN: 10
};
