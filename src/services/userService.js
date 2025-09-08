// src/services/userService.js
import db from './mockDatabase';

export const getAllUsers = async () => {
  // In a real app, you would fetch this from a database.
  return db.users;
};
