
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from backend.app import models, schemas
from backend.app.database import SessionLocal, engine

from backend.app.routers import order_router, team_router, user_router, menu_router
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router.router)
app.include_router(team_router.router)
app.include_router(menu_router.router)
app.include_router(order_router.router)
