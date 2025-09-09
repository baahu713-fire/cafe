from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    team_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
