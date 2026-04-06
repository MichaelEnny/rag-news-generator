import { isDatabaseConfigured } from "@/lib/env";
import { sql } from "@/lib/db";

type DigestSchemaInfo = {
  hasGeneratedTitle: boolean;
  hasLegacyTitle: boolean;
  hasLegacyArticleType: boolean;
  hasLegacyUrl: boolean;
};

let digestSchemaCache: Promise<DigestSchemaInfo> | null = null;

export async function getDigestSchemaInfo(): Promise<DigestSchemaInfo> {
  if (!isDatabaseConfigured()) {
    return {
      hasGeneratedTitle: true,
      hasLegacyTitle: false,
      hasLegacyArticleType: false,
      hasLegacyUrl: false
    };
  }

  if (!digestSchemaCache) {
    digestSchemaCache = sql<{ column_name: string; is_nullable: string }>(
      `
        select column_name, is_nullable
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'digests'
          and column_name in ('generated_title', 'title', 'article_type', 'url')
      `
    ).then((result) => {
      const columnMap = new Map(result.rows.map((row) => [row.column_name, row.is_nullable]));
      const hasArticleTypeNotNull = columnMap.get("article_type") === "NO";
      return {
        // Only use the generated_title path when the legacy NOT NULL columns are absent
        hasGeneratedTitle: columnMap.has("generated_title") && !hasArticleTypeNotNull,
        hasLegacyTitle: columnMap.has("title"),
        hasLegacyArticleType: columnMap.has("article_type"),
        hasLegacyUrl: columnMap.has("url")
      };
    });
  }

  return digestSchemaCache;
}

export function mapSourceSlugToLegacyArticleType(sourceSlug: string) {
  if (sourceSlug.includes("openai")) {
    return "openai";
  }

  if (sourceSlug.includes("anthropic")) {
    return "anthropic";
  }

  return "youtube";
}
