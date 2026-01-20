"""
Security utilities for creating secure API keys and tokens
"""
import secrets
import string
from typing import Optional


def create_secure_api_key(prefix: str = "sk_live", length: int = 40) -> str:
    """
    Tạo API key bảo mật sử dụng cryptographically secure random generator.
    
    Args:
        prefix: Prefix cho API key (default: 'sk_live')
        length: Độ dài của phần random (default: 40 chars)
        
    Returns:
        str: Secure API key với format 'prefix_randomstring'
        
    Example:
        >>> create_secure_api_key()
        'sk_live_a1b2c3d4e5f6789012345678901234567890abcd'
        
        >>> create_secure_api_key("api_test", 20)
        'api_test_a1b2c3d4e5f6789012'
    """
    # Sử dụng secrets.token_hex() để tạo random hex string
    random_part = secrets.token_hex(length // 2)
    return f"{prefix}_{random_part}"


def create_secure_token(length: int = 32) -> str:
    """
    Tạo secure token cho các mục đích khác.
    
    Args:
        length: Số bytes cho token (default: 32 bytes = 64 hex chars)
        
    Returns:
        str: Secure hexadecimal token
    """
    return secrets.token_hex(length)


def create_secure_password(length: int = 16) -> str:
    """
    Tạo secure password với ký tự alphanumeric.
    
    Args:
        length: Độ dài password (default: 16)
        
    Returns:
        str: Secure password
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_secure_numeric_code(length: int = 6) -> str:
    """
    Tạo secure numeric code (cho OTP, verification codes).
    
    Args:
        length: Độ dài code (default: 6)
        
    Returns:
        str: Secure numeric code
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def validate_api_key_format(api_key: str, expected_prefix: Optional[str] = None) -> bool:
    """
    Validate format của API key.
    
    Args:
        api_key: API key cần validate
        expected_prefix: Prefix mong đợi (optional)
        
    Returns:
        bool: True nếu format hợp lệ
    """
    if not api_key:
        return False
        
    # Check basic format: prefix_randomstring
    if '_' not in api_key:
        return False

    # Split để lấy phần cuối cùng là random part
    parts = api_key.split('_')
    if len(parts) < 2:
        return False

    # Prefix có thể có nhiều phần (vd: sk_live)
    prefix = '_'.join(parts[:-1])
    random_part = parts[-1]

    # Check prefix nếu được chỉ định
    if expected_prefix and prefix != expected_prefix:
        return False
        
    # Check random part có đủ dài và chỉ chứa hex chars
    if len(random_part) < 20:  # Tối thiểu 20 chars
        return False
        
    try:
        # Thử convert hex string để validate
        int(random_part, 16)
        return True
    except ValueError:
        return False


# Constants cho các loại API key khác nhau
API_KEY_PREFIXES = {
    "live": "sk_live",
    "test": "sk_test", 
    "webhook": "whsec",
    "public": "pk_live",
    "restricted": "rk_live"
}


def create_typed_api_key(key_type: str = "live", length: int = 40) -> str:
    """
    Tạo API key với type cụ thể.
    
    Args:
        key_type: Loại key ('live', 'test', 'webhook', 'public', 'restricted')
        length: Độ dài phần random
        
    Returns:
        str: Typed API key
        
    Raises:
        ValueError: Nếu key_type không hợp lệ
    """
    if key_type not in API_KEY_PREFIXES:
        raise ValueError(f"Invalid key_type. Must be one of: {list(API_KEY_PREFIXES.keys())}")
        
    prefix = API_KEY_PREFIXES[key_type]
    return create_secure_api_key(prefix, length)
