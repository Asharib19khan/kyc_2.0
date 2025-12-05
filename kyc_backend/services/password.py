from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return ph.hash(password)

def verify_password(hash_str: str, password: str) -> bool:
    """Verify a password against an Argon2 hash."""
    try:
        return ph.verify(hash_str, password)
    except VerifyMismatchError:
        return False
    except Exception as e:
        print(f"Password verification error: {e}")
        return False
