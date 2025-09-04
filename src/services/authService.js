import db from './mockDatabase';

const getUserByEmail = (email) => {
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

export const login = (email, password) => {
  const user = getUserByEmail(email);
  if (user && user.password === password) {
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
    id: db.nextUserId++,
    email,
    password,
    role: 'customer',
    isAdmin: false,
  };
  db.users.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const getAllUsers = () => {
    return db.users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
};