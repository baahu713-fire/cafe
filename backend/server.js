require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const client = require('./src/config/redis');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const captchaRoutes = require('./src/routes/captcha');

const app = express();

// Initialize Redis Client
const redisClient = client;
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Dynamic import of connect-redis
let RedisStore;
(async () => {
  // await redisClient.connect();
  RedisStore = (await import('connect-redis')).default;

  // Session middleware configuration
  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
      secret: process.env.SESSION_SECRET || 'your-super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 10 * 60 * 1000, // 10 minutes
      },
    })
  );

  // API Routes - must be registered after session middleware
  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api', captchaRoutes);

  // Multer error handling
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max 100KB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next(err);
  });

  // Generic error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

})();

// Middleware (some can be defined synchronously)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
