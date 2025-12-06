from argon2 import PasswordHasher
from cryptography.fernet import Fernet
import os

# --- CONFIG ---
# In a real app, keep this key SAFE (env var). For this student project, we store it here or verify existence.
KEY_FILE = 'secret.key'

def load_or_generate_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(KEY_FILE, 'wb') as f:
            f.write(key)
        return key

cipher_suite = Fernet(load_or_generate_key())
ph = PasswordHasher()

# --- PASSWORD HASHING (Argon2) ---
def hash_password(password):
    return ph.hash(password)

def verify_password(hash, password):
    try:
        return ph.verify(hash, password)
    except:
        return False

# --- DATA ENCRYPTION (AES-256) ---
def encrypt_value(text):
    if not text: return None
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_value(encrypted_text):
    if not encrypted_text: return None
    try:
        return cipher_suite.decrypt(encrypted_text.encode()).decode()
    except:
        return "[Encrypted]" # Fail safe
