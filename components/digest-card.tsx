import { relativeHoursFromNow } from "@/lib/format";
import type { CurationPreviewItem } from "@/lib/types";

export function DigestCard({ digest }: { digest: CurationPreviewItem }) {
  return (
    <article className="panel digest-card">
      <div className="digest-card-header">
        <p className="eyebrow">
          #{digest.rank} • {digest.sourceSlug.replace(/-/g, " ")}
        </p>
        <span className="score-badge">{digest.relevanceScore.toFixed(1)}</span>
      </div>
      <h3>{digest.title}</h3>
      <p>{digest.summary}</p>
      <div className="digest-card-footer">
        <span className="muted">{relativeHoursFromNow(digest.publishedAt)}</span>
        <a href={digest.url} target="_blank" rel="noreferrer">
          Open source
        </a>
      </div>
    </article>
  );
}
