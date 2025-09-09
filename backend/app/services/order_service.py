from sqlalchemy.orm import Session
from .. import models, schemas

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate):
    db_order = models.Order(user_id=order.user_id, total_price=0)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    total_price = 0
    for item in order.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item.menu_item_id).first()
        if not menu_item:
            # Handle error: menu item not found
            continue

        price = menu_item.price
        if item.proportion_name and item.proportion_name in menu_item.proportions:
            price *= menu_item.proportions[item.proportion_name]

        total_price += price * item.quantity
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item.menu_item_id,
            proportion_name=item.proportion_name,
            quantity=item.quantity,
            price_at_order=price,
            name_at_order=menu_item.name
        )
        db.add(db_order_item)

    db_order.total_price = total_price
    db.commit()
    db.refresh(db_order)
    return db_order
