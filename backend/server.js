const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const menuRoutes = require('./src/routes/menuRoutes');
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
