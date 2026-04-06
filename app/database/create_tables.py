import sys
from pathlib import Path
import os

from sqlalchemy.exc import OperationalError

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def _connection_target() -> str:
    user = os.getenv("POSTGRES_USER", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5433")
    db = os.getenv("POSTGRES_DB", "ai_news_aggregator")
    return f"{user}@{host}:{port}/{db}"

def main() -> int:
    try:
        from app.database.models import Base
        from app.database.connection import engine
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    try:
        Base.metadata.create_all(engine)
    except OperationalError as exc:
        print(
            f"Failed to connect to PostgreSQL at {_connection_target()}.\n"
            "Verify your POSTGRES_* values and make sure they match the running database.",
            file=sys.stderr,
        )
        return 1

    print("Tables created successfully")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

