import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from config import Config

def encrypt_data(data: str) -> str:
    """Encrypts string data using AES-256-GCM. Returns base64 string."""
    if not data:
        return ""
        
    key = bytes.fromhex(Config.AES_SECRET_KEY)
    iv = os.urandom(12)  # Recommended IV size for GCM is 12 bytes

    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()

    ciphertext = encryptor.update(data.encode('utf-8')) + encryptor.finalize()

    # Combine IV + Tag + Ciphertext for storage
    encrypted_blob = iv + encryptor.tag + ciphertext
    return base64.b64encode(encrypted_blob).decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    """Decrypts base64 encoded AES-256-GCM data."""
    if not encrypted_data:
        return ""
        
    try:
        data = base64.b64decode(encrypted_data)
        iv = data[:12]
        tag = data[12:28]
        ciphertext = data[28:]
        
        key = bytes.fromhex(Config.AES_SECRET_KEY)

        decryptor = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        ).decryptor()

        return (decryptor.update(ciphertext) + decryptor.finalize()).decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return None
