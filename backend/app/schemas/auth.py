from typing import Optional
from pydantic import BaseModel, Field
from app.db.models import RoleEnum


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)
    policy_number: Optional[str] = "POL-992310"
    phone: Optional[str] = "+91 98450 00000"
    role: RoleEnum = RoleEnum.CUSTOMER


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: RoleEnum
    policy_number: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserRead
