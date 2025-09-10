from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- CENTRALIZED DATABASE SESSION DEPENDENCY ---
def get_db():
    """
    FastAPI dependency to create and manage a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()