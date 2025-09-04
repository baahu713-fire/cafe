// src/services/userService.js
import db from './mockDatabase';

export const login = async (email, password) => {
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Invalid email or password');
  }
  return user;
};

export const signup = async (email, password) => {
  if (db.users.find(u => u.email === email)) {
    throw new Error('User with this email already exists');
  }
  const newUser = {
    id: db.nextUserId++,
    email,
    password,
    role: 'customer', // Default role
    isAdmin: false,
  };
  db.users.push(newUser);
  return newUser;
};

export const getAllUsers = async () => {
    // In a real app, this would be a protected admin endpoint.
    await new Promise(res => setTimeout(res, 200));
    return db.users;
};
