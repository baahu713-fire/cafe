from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="Pending")

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    proportion_name = Column(String(255))
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(Float, nullable=False)
    name_at_order = Column(String(255), nullable=False)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")
