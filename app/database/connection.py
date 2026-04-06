import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

def get_database_url() -> str:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5433")
    db = os.getenv("POSTGRES_DB", "ai_news_aggregator")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

def create_database_engine():
    try:
        return create_engine(get_database_url())
    except ModuleNotFoundError as exc:
        if exc.name == "psycopg2":
            raise RuntimeError(
                "Missing PostgreSQL driver 'psycopg2'. Run this project with "
                "'.\\.venv\\Scripts\\python.exe' or install dependencies with 'uv sync'."
            ) from exc
        raise

engine = create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session():
    return SessionLocal()

