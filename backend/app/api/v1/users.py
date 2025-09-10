from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random

from app import models, schemas
from app.core import security
# Corrected import: Use the centralized db session
from app.db import get_db
from app.utils import email

router = APIRouter()

# --- Check Username Availability and Get Suggestions ---
@router.post("/check-username", response_model=schemas.UsernameCheckResponse)
def check_username(request: schemas.UsernameCheckRequest, db: Session = Depends(get_db)):
    """
    Checks if a username is available. If not, provides suggestions.
    """
    base_username = request.username
    user = db.query(models.User).filter(models.User.username == base_username).first()

    if not user:
        return {"is_available": True, "suggestions": []}

    # Generate suggestions if the username is taken
    suggestions = []
    # Check for simple numeric suffixes first
    for i in range(1, 4):
        suggestion = f"{base_username}{i}"
        if not db.query(models.User).filter(models.User.username == suggestion).first():
            suggestions.append(suggestion)
    
    # Add a more random suggestion if simple ones are taken
    while len(suggestions) < 3:
        suggestion = f"{base_username}{random.randint(10, 999)}"
        if not db.query(models.User).filter(models.User.username == suggestion).first():
            suggestions.append(suggestion)

    return {"is_available": False, "suggestions": list(set(suggestions))}


# --- User Signup Endpoint (Now a two-step process) ---
@router.post("/signup", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_signup(user_data: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Step 1 of Signup: Create an inactive user and send an OTP.
    The user account will not be usable until the OTP is verified.
    """
    # Delete inactive users with same email before inserting new one
    db.query(models.User).filter(
        models.User.email == user_data.email,
        models.User.is_active == False
    ).delete()
    db.commit()

    if db.query(models.User).filter(models.User.email == user_data.email, models.User.is_active == True).first():
        raise HTTPException(status_code=400, detail="An active account with this email already exists.")
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")

    hashed_password = security.get_password_hash(user_data.password)
    otp = email.generate_otp()
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        password=hashed_password,
        is_active=False,
        otp=otp,
        otp_expires_at=otp_expires_at
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    background_tasks.add_task(email.send_otp_email, email=user_data.email, otp=otp)
    
    return db_user

# --- Verify OTP Endpoint ---
@router.post("/verify-otp", response_model=schemas.User)
def verify_otp(otp_data: schemas.OTPVerify, db: Session = Depends(get_db)):
    """
    Step 2 of Signup: Verifies the OTP to activate a user account.
    """
    user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_active:
        raise HTTPException(status_code=400, detail="Account is already active.")
    if user.otp != otp_data.otp or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
        
    user.is_active = True
    user.otp = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)
    
    return user


# --- User Login Endpoint (Now checks if user is active) ---
# --- User Login Endpoint (Now checks if user is active) ---
@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Handles user login for active users.
    """
    print("logging in..")

    # 👀 Debug: What is frontend sending?
    print("📩 Login request received:")
    print(f"   Username: {form_data.username}")
    print(f"   Password: {form_data.password}")

    # 👀 Debug: What query we are executing?
    print(f"🔍 Searching DB for username: {form_data.username}")
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user:
        print("❌ No user found with that username.")
    else:
        print(f"✅ User found in DB: {user.username}, active={user.is_active}")

    # 👀 Debug: Verify password step
    if not user or not security.verify_password(form_data.password, user.password):
        print("❌ Password check failed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        print("⚠️ User exists but account is not active.")
        raise HTTPException(
            status_code=400, 
            detail="Account is not active. Please verify your email with the OTP."
        )

    access_token = security.create_access_token(data={"sub": user.username})
    print(f"✅ Login successful. Access token created for {user.username}")
    
    return {"access_token": access_token, "token_type": "bearer"}


# --- Forgot Password Endpoint ---
@router.post("/forgot-password")
def forgot_password(request: schemas.PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Sends an OTP to the user's email for password reset.
    """
    user = db.query(models.User).filter(models.User.email == request.email, models.User.is_active == True).first()
    if not user:
        return {"message": "If an account with this email exists, a password reset OTP has been sent."}
    
    otp = email.generate_otp()
    user.otp = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    
    background_tasks.add_task(email.send_otp_email, email=user.email, otp=otp)
    
    return {"message": "If an account with this email exists, a password reset OTP has been sent."}

# --- Reset Password Endpoint ---
@router.post("/reset-password")
def reset_password(request: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Resets the user's password using the OTP.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.otp != request.otp or user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    user.password = security.get_password_hash(request.new_password)
    user.otp = None
    user.otp_expires_at = None
    db.commit()
    
    return {"message": "Password has been reset successfully."}


# --- Get Current User Info ---
@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    """
    Get the details of the currently authenticated user.
    """
    return current_user


# --- Delete User Account Endpoint ---
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    """
    Deletes the currently authenticated user's account.
    """
    db.delete(current_user)
    db.commit()
    return None
