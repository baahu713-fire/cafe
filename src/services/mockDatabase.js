const db = {
  users: [
    {
      id: 1,
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
      isAdmin: false,
    },
    {
      id: 2,
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isAdmin: true,
    },
    {
      id: 3,
      email: 'superadmin@example.com',
      password: 'password123',
      role: 'superadmin',
      isAdmin: true,
    },
  ],
  menuItems: [
    { id: 1, name: 'Espresso', price: 2.50, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Espresso' },
    { id: 2, name: 'Latte', price: 3.50, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Latte' },
    { id: 3, name: 'Cappuccino', price: 3.50, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Cappuccino' },
    { id: 4, name: 'Mocha', price: 4.00, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Mocha' },
    { id: 5, name: 'Iced Coffee', price: 3.00, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Iced+Coffee' },
    { id: 6, name: 'Croissant', price: 2.75, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Croissant' },
    { id: 7, name: 'Muffin', price: 2.25, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Muffin' },
    { id: 8, name: 'Cheesecake', price: 4.50, image: 'https://placehold.co/600x400/E2D5C3/5D4037?text=Cheesecake' },
  ],
  orders: [],
  feedback: [],
  nextUserId: 4,
  nextOrderId: 1,
  CANCELLATION_WINDOW_MS: 60 * 1000, // 1 minute
};

export default db;