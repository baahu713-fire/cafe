from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    activated_from = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="team")
