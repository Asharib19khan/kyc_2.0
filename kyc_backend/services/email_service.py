def send_email(to_email: str, subject: str, body: str):
    """
    Mock function to send emails.
    In a real system, this would use SMTP.
    """
    print(f"--- MOCK EMAIL ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print(f"------------------")
