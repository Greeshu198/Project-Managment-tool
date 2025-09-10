import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the project root to the Python path to allow imports from 'app'
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.user import User

def cleanup_users():
    """
    Connects to the database and deletes inactive user accounts that are older
    than a specified threshold (e.g., 24 hours).
    """
    print(f"--- Running inactive user cleanup at {datetime.now(timezone.utc)} ---")
    
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("ERROR: DATABASE_URL not found in .env file. Exiting.")
        return

    # Alembic's ini file uses '%%' for escaping, but create_engine needs single '%'
    if '%%' in database_url:
        database_url = database_url.replace('%%', '%')

    try:
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
    except Exception as e:
        print(f"ERROR: Could not connect to the database: {e}")
        return

    try:
        cleanup_threshold = datetime.now(timezone.utc) - timedelta(hours=24)
        
        users_to_delete = db.query(User).filter(
            User.is_active == False,
            User.created_at < cleanup_threshold
        ).all()
        
        if not users_to_delete:
            print("No inactive users to delete.")
            return

        num_deleted = len(users_to_delete)
        
        for user in users_to_delete:
            db.delete(user)
            
        db.commit()
        print(f"SUCCESS: Successfully deleted {num_deleted} inactive user(s).")

    except Exception as e:
        print(f"ERROR: An error occurred during the cleanup process: {e}")
        db.rollback()
    finally:
        db.close()
        print("--- Cleanup finished ---")

if __name__ == "__main__":
    cleanup_users()
