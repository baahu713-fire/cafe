// src/services/menuService.js
import db from './mockDatabase';

export const getMenu = async () => {
  // Simulate async fetch
  await new Promise(res => setTimeout(res, 200));
  return db.menuItems;
};

export const addMenuItem = async (item) => {
  const newItem = {
    ...item,
    id: db.menuItems.length > 0 ? Math.max(...db.menuItems.map(i => i.id)) + 1 : 1,
    price: parseFloat(item.price) || 0,
    proportions: item.proportions || [],
    availability: item.availability || [],
  };
  db.menuItems.push(newItem);
  return newItem;
};

export const updateMenuItem = async (itemId, updates) => {
  const itemIndex = db.menuItems.findIndex(i => i.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Menu item not found.');
  }
  
  const updatedItem = { 
    ...db.menuItems[itemIndex], 
    ...updates,
    price: parseFloat(updates.price) || 0,
  };

  db.menuItems[itemIndex] = updatedItem;
  return updatedItem;
};

export const deleteMenuItem = async (itemId) => {
  const itemIndex = db.menuItems.findIndex(i => i.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Menu item not found.');
  }
  db.menuItems.splice(itemIndex, 1);
  return { message: 'Item deleted successfully' };
};
