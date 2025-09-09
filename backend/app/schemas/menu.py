from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    availability: Optional[List[str]] = []
    proportions: Optional[Dict[str, float]] = {}
    available: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    id: int
    created_at: datetime
    deleted_from: Optional[datetime] = None

    class Config:
        from_attributes = True
