// src/services/authService.js

import { users, nextUserId } from './mockDatabase';

const getUserByEmail = (email) => {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

export const login = (email, password) => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    // In a real app, you wouldn't send the password back.
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export const register = (email, password) => {
  if (getUserByEmail(email)) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: nextUserId++,
    email,
    password,
    role: 'customer', // All new registrations are customers by default
    isAdmin: false,
  };
  users.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};
