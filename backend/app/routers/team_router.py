from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas
from ..services import team_service
from ..database import get_db

router = APIRouter()

@router.post("/teams/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    return team_service.create_team(db=db, team=team)

@router.get("/teams/", response_model=list[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teams = team_service.get_teams(db, skip=skip, limit=limit)
    return teams

@router.get("/teams/{team_id}", response_model=schemas.Team)
def read_team(team_id: int, db: Session = Depends(get_db)):
    db_team = team_service.get_team(db, team_id=team_id)
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return db_team
