from datetime import datetime, timedelta, timezone
from typing import Optional, List, Callable
import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import AuthenticationException, AuthorizationException
from app.db.session import get_db
from app.db.models import User, RoleEnum

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    subject: str,
    role: str,
    user_id: int,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "role": role,
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise AuthenticationException(f"Invalid or expired authentication token: {exc}")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or not credentials.credentials:
        raise AuthenticationException("Missing Bearer authentication token")
    payload = decode_access_token(credentials.credentials)
    email = payload.get("sub")
    if not email:
        raise AuthenticationException("Malformed authentication token subject")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise AuthenticationException("User account not found or inactive")
    return user


def require_roles(allowed_roles: List[RoleEnum]) -> Callable:
    """
    Dependency factory enforcing strict Role-Based Access Control (Section 21).
    Roles: CUSTOMER, CLAIM_HANDLER, ADMIN.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise AuthorizationException(
                f"Role '{current_user.role.value}' is not authorized. Required: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker
