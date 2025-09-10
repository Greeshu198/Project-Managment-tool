import random
import string
import os
from dotenv import load_dotenv
from fastapi import HTTPException

# Import the SendGrid library
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

# --- Live Email Sending Function ---
def send_otp_email(email: str, otp: str):
    """
    Sends an OTP to the specified email address using SendGrid.
    Falls back to printing to console if API key is not configured.
    """
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    sender_email = os.environ.get('SENDER_EMAIL')

    # If SendGrid is not configured, simulate the email for development
    if not sendgrid_api_key or not sender_email:
        print("--- EMAIL SIMULATION (SendGrid not configured) ---")
        print(f"To: {email}")
        print(f"Subject: Your Verification Code")
        print(f"Body: Your OTP is: {otp}. It will expire in 10 minutes.")
        print("--------------------------------------------------")
        return # Stop execution if not configured

    # --- REAL IMPLEMENTATION using SendGrid ---
    message = Mail(
        from_email=sender_email,
        to_emails=email,
        subject='Your Project Management Tool Verification Code',
        html_content=f'<strong>Your OTP is: {otp}</strong>. It is valid for 10 minutes.'
    )
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        print(f"Email sent to {email}. Status code: {response.status_code}")
    except Exception as e:
        print(f"Error sending email: {e}")
        # In a production environment, you might want to handle this more gracefully
        raise HTTPException(status_code=500, detail="Failed to send verification email.")


def generate_otp(length: int = 6) -> str:
    """Generates a random OTP of a specified length."""
    characters = string.digits
    return "".join(random.choice(characters) for _ in range(length))