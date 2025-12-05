import re

def is_valid_email(email: str) -> bool:
    """Check if email format is valid."""
    regex = r'^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'
    return re.search(regex, email) is not None

def is_valid_password(password: str) -> bool:
    """
    Check if password is at least 8 chars.
    Full complexity check is simplified for this demo.
    """
    return len(password) >= 8

def validate_registration_data(data: dict) -> list[str]:
    """Validate registration payload."""
    errors = []
    if not data.get('email') or not is_valid_email(data['email']):
        errors.append("Invalid email.")
    if not data.get('password') or not is_valid_password(data['password']):
        errors.append("Password must be at least 8 characters.")
    if not data.get('first_name'):
        errors.append("First name is required.")
    if not data.get('last_name'):
        errors.append("Last name is required.")
    return errors
