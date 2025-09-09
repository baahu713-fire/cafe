from sqlalchemy.orm import Session
from .. import models, schemas

def get_menu_item(db: Session, menu_item_id: int):
    return db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()

def get_menu_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MenuItem).offset(skip).limit(limit).all()

def create_menu_item(db: Session, menu_item: schemas.MenuItemCreate):
    db_menu_item = models.MenuItem(**menu_item.dict())
    db.add(db_menu_item)
    db.commit()
    db.refresh(db_menu_item)
    return db_menu_item
