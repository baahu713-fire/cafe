from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .menu import MenuItem

class OrderItemBase(BaseModel):
    menu_item_id: int
    proportion_name: Optional[str] = None
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price_at_order: float
    name_at_order: str

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    user_id: int

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    total_price: float
    created_at: datetime
    status: str
    items: List[OrderItem] = []

    class Config:
        from_attributes = True
