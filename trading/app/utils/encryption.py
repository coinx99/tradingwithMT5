from cryptography.fernet import Fernet
import os
from app.utils.log import log

# Generate or load encryption key
def get_encryption_key() -> bytes:
    """Get or generate encryption key for password storage"""
    key_file = "encryption.key"
    
    if os.path.exists(key_file):
        try:
            with open(key_file, "rb") as f:
                return f.read()
        except Exception as e:
            log.error(f"Failed to read encryption key: {e}")
    
    # Generate new key
    key = Fernet.generate_key()
    try:
        with open(key_file, "wb") as f:
            f.write(key)
        log.info("Generated new encryption key")
    except Exception as e:
        log.error(f"Failed to save encryption key: {e}")
    
    return key


# Initialize Fernet cipher
ENCRYPTION_KEY = get_encryption_key()
cipher_suite = Fernet(ENCRYPTION_KEY)


def encrypt_password(password: str) -> str:
    """Encrypt a password for secure storage"""
    try:
        if not password:
            raise ValueError("Password cannot be empty")
        
        # Convert to bytes and encrypt
        password_bytes = password.encode('utf-8')
        encrypted_bytes = cipher_suite.encrypt(password_bytes)
        
        # Return as base64 string
        return encrypted_bytes.decode('utf-8')
        
    except Exception as e:
        log.error(f"Failed to encrypt password: {e}")
        raise Exception("Password encryption failed")


def decrypt_password(encrypted_password: str) -> str:
    """Decrypt a stored password"""
    try:
        if not encrypted_password:
            raise ValueError("Encrypted password cannot be empty")
        
        # Convert from base64 and decrypt
        encrypted_bytes = encrypted_password.encode('utf-8')
        decrypted_bytes = cipher_suite.decrypt(encrypted_bytes)
        
        # Return as string
        return decrypted_bytes.decode('utf-8')
        
    except Exception as e:
        log.error(f"Failed to decrypt password: {e}")
        raise Exception("Password decryption failed")


def validate_password_strength(password: str) -> bool:
    """Validate password strength for MT5 accounts"""
    if not password:
        return False
    
    # Basic validation - MT5 passwords can be complex
    if len(password) < 6:
        return False
    
    # Add more sophisticated validation if needed
    return True
