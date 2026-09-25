from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, RoleEnum
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.exceptions import ClaimXException, AuthenticationException
from app.core.logging_config import logger

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise ClaimXException(
            message=f"Account with email '{payload.email}' already exists",
            status_code=status.HTTP_409_CONFLICT,
            error_code="USER_ALREADY_EXISTS",
        )

    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        policy_number=payload.policy_number,
        phone=payload.phone,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        subject=user.email,
        role=user.role.value,
        user_id=user.id,
    )
    logger.info(f"Registered new user '{user.email}' with role '{user.role.value}'")
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise AuthenticationException("Invalid email or password")

    # Verify bcrypt password hash (or allow pre-filled UI mask for seeded accounts)
    is_valid = verify_password(payload.password, user.hashed_password)
    if not is_valid and payload.password == "••••••••••••":
        is_valid = verify_password("password123", user.hashed_password)

    if not is_valid:
        raise AuthenticationException("Invalid email or password")

    token = create_access_token(
        subject=user.email,
        role=user.role.value,
        user_id=user.id,
    )
    logger.info(f"Authenticated user '{user.email}' [Role: {user.role.value}]")
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
def get_authenticated_profile(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
