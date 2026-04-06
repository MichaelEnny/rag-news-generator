from typing import Optional
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.agent.digest_agent import DigestAgent
from app.database.repository import Repository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def process_digests(limit: Optional[int] = None) -> dict:
    agent = DigestAgent()
    repo = Repository()

    articles = repo.get_articles_without_digest(limit=limit)
    total = len(articles)
    processed = 0
    failed = 0

    logger.info("Starting digest processing for %s articles", total)

    for idx, article in enumerate(articles, 1):
        article_type = article["type"]
        article_id = article["id"]
        article_title = (
            article["title"][:60] + "..."
            if len(article["title"]) > 60
            else article["title"]
        )

        logger.info(
            "[%s/%s] Processing %s: %s (ID: %s)",
            idx,
            total,
            article_type,
            article_title,
            article_id,
        )

        try:
            digest_result = agent.generate_digest(
                title=article["title"],
                content=article["content"],
                article_type=article_type,
            )

            if digest_result:
                repo.create_digest(
                    article_type=article_type,
                    article_id=article_id,
                    url=article["url"],
                    title=digest_result.title,
                    summary=digest_result.summary,
                    published_at=article.get("published_at"),
                )
                processed += 1
                logger.info("[OK] Successfully created digest for %s %s", article_type, article_id)
            else:
                failed += 1
                logger.warning("[WARN] Failed to generate digest for %s %s", article_type, article_id)
        except Exception as exc:
            failed += 1
            logger.error("[ERROR] Error processing %s %s: %s", article_type, article_id, exc)

    logger.info(
        "Processing complete: %s processed, %s failed out of %s total",
        processed,
        failed,
        total,
    )

    return {
        "total": total,
        "processed": processed,
        "failed": failed,
    }


if __name__ == "__main__":
    result = process_digests()
    print(f"Total articles: {result['total']}")
    print(f"Processed: {result['processed']}")
    print(f"Failed: {result['failed']}")
