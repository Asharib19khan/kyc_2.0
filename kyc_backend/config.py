import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_dev_key_change_in_prod')
    # Default path assumes running from kyc_backend directory
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'kyc_system.accdb')
    # Use MS Access Driver
    DB_CONNECTION_STRING = fr"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DB_PATH};"
    
    # Security Config
    JWT_EXPIRATION_MINUTES = 30
    BCRYPT_LOG_ROUNDS = 13
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

    # Encryption Key (Must be 32 bytes for AES-256 in hex or base64)
    # This should be loaded from env in prod
    AES_SECRET_KEY = os.getenv('AES_SECRET_KEY', '0'*64) 
