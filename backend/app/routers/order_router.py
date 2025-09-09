from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..services import order_service
from ..database import get_db

router = APIRouter()

@router.post("/orders/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return order_service.create_order(db=db, order=order)

@router.get("/orders/", response_model=list[schemas.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = order_service.get_orders(db, skip=skip, limit=limit)
    return orders

@router.get("/orders/{order_id}", response_model=schemas.Order)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = order_service.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order
