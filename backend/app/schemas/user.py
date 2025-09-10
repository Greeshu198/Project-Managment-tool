from pydantic import BaseModel, EmailStr
from typing import Optional, List

# --- Base Schema ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

# --- Create Schema ---
class UserCreate(UserBase):
    password: str

# --- User Schema ---
class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# --- OTP and Password Reset Schemas ---
class UsernameCheckRequest(BaseModel):
    username: str

class UsernameCheckResponse(BaseModel):
    is_available: bool
    suggestions: List[str] = []

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# --- NEW SCHEMA FOR OTP RESEND ---
class ResendOTPRequest(BaseModel):
    email: EmailStr
# --- END NEW SCHEMA ---
    
# --- Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

