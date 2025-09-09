from pydantic import BaseModel
from datetime import datetime

class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    activated_from: datetime

    class Config:
        from_attributes = True
