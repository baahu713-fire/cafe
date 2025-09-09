from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    image = Column(String(255))
    availability = Column(JSON) # Using JSON for array of strings
    proportions = Column(JSON) # Using JSON for proportions object
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_from = Column(DateTime(timezone=True))
    available = Column(Boolean, default=True)
