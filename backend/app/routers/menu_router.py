from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..services import menu_service
from ..database import get_db

router = APIRouter()

@router.post("/menu-items/", response_model=schemas.MenuItem)
def create_menu_item(menu_item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    return menu_service.create_menu_item(db=db, menu_item=menu_item)

@router.get("/menu-items/", response_model=list[schemas.MenuItem])
def read_menu_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    menu_items = menu_service.get_menu_items(db, skip=skip, limit=limit)
    return menu_items

@router.get("/menu-items/{menu_item_id}", response_model=schemas.MenuItem)
def read_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    db_menu_item = menu_service.get_menu_item(db, menu_item_id=menu_item_id)
    if db_menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return db_menu_item
