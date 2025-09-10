import os
import sys
from dotenv import load_dotenv

# This is a bit of a hack to allow this script to import from the 'app' module
# It adds the parent directory ('backend') to Python's path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.email import send_otp_email, generate_otp

def run_test():
    """
    A simple script to test the SendGrid email sending functionality.
    """
    print("--- Starting SendGrid Email Test ---")
    
    # Load environment variables from .env file
    load_dotenv()
    
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDER_EMAIL")

    if not sendgrid_api_key or not sender_email:
        print("\nERROR: SENDGRID_API_KEY and SENDER_EMAIL must be set in your .env file.")
        return

    print(f"Sender Email (from .env): {sender_email}")
    
    # Get the recipient's email from the command line
    if len(sys.argv) < 2:
        print("\nUsage: python test_email.py <recipient_email@example.com>")
        return
        
    recipient_email = sys.argv[1]
    print(f"Attempting to send a test OTP to: {recipient_email}")

    try:
        # Generate a test OTP
        otp = generate_otp()
        
        # Call the actual email sending function
        send_otp_email(email=recipient_email, otp=otp)
        
        print("\nSUCCESS: The request to SendGrid was sent.")
        print("Please check the following:")
        print(f"1. The inbox of '{recipient_email}' for the test email (and the spam folder).")
        print("2. The SendGrid Activity Feed to see if the email was processed.")
        print("3. The console output from your app.utils.email function for the simulated email.")

    except Exception as e:
        print(f"\nERROR: An exception occurred while trying to send the email: {e}")

if __name__ == "__main__":
    run_test()
