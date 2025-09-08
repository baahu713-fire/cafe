import { rest } from 'msw';

const menu = [
  { id: 1, name: 'Pizza', description: 'A delicious pizza', price: 10, image: '' },
];

const users = [
    { id: '1', email: 'admin@test.com', password: 'password', isAdmin: true },
    { id: '2', email: 'user@test.com', password: 'password', isAdmin: false },
];

let orders = [];

export const handlers = [
  rest.get('/api/menu', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(menu));
  }),

  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(users));
  }),

  rest.post('/api/orders', (req, res, ctx) => {
    const { userId, items, comments } = req.body;
    const newOrder = { id: orders.length + 1, userId, items, comments, status: 'pending' };
    orders.push(newOrder);
    return res(ctx.status(201), ctx.json(newOrder));
  }),

  rest.post('/api/login', (req, res, ctx) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      return res(ctx.status(200), ctx.json(user));
    }
    return res(ctx.status(401));
  })
];
