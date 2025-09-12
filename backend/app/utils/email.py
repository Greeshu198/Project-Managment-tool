import random
import string
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from datetime import datetime  # <-- MOVED THIS IMPORT TO THE TOP

# Import the SendGrid library
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

# --- Helper to get required environment variables ---
def get_email_config():
    """Fetches and returns common email configuration from environment variables."""
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    sender_email = os.environ.get('SENDER_EMAIL')
    # Set a default frontend URL for local development if not specified
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    if not sendgrid_api_key or not sender_email:
        print("\n--- WARNING: SendGrid environment variables (SENDGRID_API_KEY, SENDER_EMAIL) are not set. ---")
        print("--- Email functionality will be simulated in the console. ---\n")
    
    return sendgrid_api_key, sender_email, frontend_url

# --- NEW: Centralized HTML Email Template ---
def _get_email_template(content: str, button_url: str = None, button_text: str = None) -> str:
    """Creates a professional-looking, branded HTML email template."""
    button_html = ""
    if button_url and button_text:
        button_html = f"""
        <a href="{button_url}" style="display: inline-block; padding: 12px 25px; margin: 20px 0; font-size: 16px; font-weight: bold; background-color: #667eea; color: white; text-decoration: none; border-radius: 8px;">
            {button_text}
        </a>
        """

    return f"""
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0a0a0a; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                TaskMaster
            </h1>
        </div>
        <div style="padding: 30px;">
            {content}
            {button_html}
            <p style="color: #888; font-size: 12px;">If you did not request this email, please ignore it.</p>
        </div>
        <div style="background-color: #f7f7f7; color: #888; text-align: center; padding: 15px; font-size: 12px;">
            &copy; {datetime.now().year} TaskMaster. All rights reserved.
        </div>
    </div>
    """

# --- NEW: Centralized Email Sending Logic ---
def _send_email(recipient_email: str, subject: str, html_content: str):
    """A helper function to handle the actual email sending via SendGrid."""
    sendgrid_api_key, sender_email, _ = get_email_config()

    if not sendgrid_api_key or not sender_email:
        print("\n--- EMAIL SIMULATION (SendGrid not configured) ---")
        print(f"To: {recipient_email}\nSubject: {subject}\n--- Body ---\n{html_content}\n------------------\n")
        return

    message = Mail(
        from_email=sender_email,
        to_emails=recipient_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        sg.send(message)
    except Exception as e:
        print(f"Error sending email to {recipient_email}: {e}")
        # In a production environment, you might re-throw a custom exception here
        # For now, we will allow the API call to succeed even if email fails.

# --- Public Email Functions (Refactored) ---

def send_otp_email(email: str, otp: str):
    """Sends a verification OTP using the new template."""
    subject = "Your TaskMaster Verification Code"
    content = f"""
    <p>Hi there,</p>
    <p>Your one-time password (OTP) to verify your account is:</p>
    <h2 style="text-align: center; font-size: 36px; letter-spacing: 5px; margin: 20px 0; color: #333;">
        {otp}
    </h2>
    <p>This code is valid for 10 minutes.</p>
    """
    html_body = _get_email_template(content)
    _send_email(recipient_email=email, subject=subject, html_content=html_body)


def send_invitation_to_existing_user(recipient_email: str, inviter_name: str, team_name: str, role: str):
    """Sends a team invitation to an existing user."""
    _, _, frontend_url = get_email_config()
    subject = f"You're invited to join {team_name} on TaskMaster"
    content = f"""
    <p>Hi there,</p>
    <p><strong>{inviter_name}</strong> has invited you to collaborate in the "<strong>{team_name}</strong>" team as a <strong>{role}</strong>.</p>
    <p>Since you already have an account, you can accept or decline this invitation directly from your dashboard.</p>
    """
    html_body = _get_email_template(content, button_url=f"{frontend_url}/login", button_text="Go to Dashboard")
    _send_email(recipient_email=recipient_email, subject=subject, html_content=html_body)


def send_invitation_to_new_user(recipient_email: str, inviter_name: str, team_name: str, role: str):
    """Sends a team invitation to a new user, prompting them to sign up."""
    _, _, frontend_url = get_email_config()
    subject = f"You're invited to join {team_name} on TaskMaster"
    content = f"""
    <p>Hi there,</p>
    <p><strong>{inviter_name}</strong> has invited you to collaborate in the "<strong>{team_name}</strong>" team as a <strong>{role}</strong>.</p>
    <p>TaskMaster is a powerful tool designed to help teams organize tasks, track progress, and achieve their goals together.</p>
    <p>To accept this invitation, you'll first need to create an account using this email address.</p>
    """
    html_body = _get_email_template(content, button_url=f"{frontend_url}/signup?email={recipient_email}", button_text="Create Your Account")
    _send_email(recipient_email=recipient_email, subject=subject, html_content=html_body)


# --- Utility Functions (Unchanged) ---
def generate_otp(length: int = 6) -> str:
    """Generates a random OTP of a specified length."""
    characters = string.digits
    return "".join(random.choice(characters) for _ in range(length))

