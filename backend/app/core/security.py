import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import models, schemas
from app.db import get_db

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_dev_that_should_be_changed")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

# --- Password Hashing Context ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


# --- Utility Functions ---
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependency to Get the Current User (WITH DEBUGGING) ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Dependency to decode and validate a JWT token and retrieve the user.
    Now includes detailed print statements for debugging.
    """
    print("\n--- 🕵️‍♂️ DEBUG: Inside get_current_user ---")
    print(f"Received Token: {token}")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded Payload: {payload}")
        
        username: str = payload.get("sub")
        if username is None:
            print("❌ DEBUG: Username (sub) not found in payload.")
            raise credentials_exception
            
        token_data = schemas.TokenData(username=username)
        print(f"Token data is valid for username: {token_data.username}")

    except JWTError as e:
        # --- THIS WILL PRINT THE EXACT JWT ERROR ---
        print(f"❌ DEBUG: JWTError occurred: {e}")
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    
    if user is None:
        print(f"❌ DEBUG: User '{token_data.username}' not found in the database.")
        raise credentials_exception
    
    print(f"✅ DEBUG: User '{user.username}' found and authenticated.")
    print("----------------------------------------\n")
    return user
