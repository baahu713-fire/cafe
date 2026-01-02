require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { getRedisClient } = require('./src/config/redis');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const captchaRoutes = require('./src/routes/captcha');

const app = express();
app.set('trust proxy', 1);

// Security & Logging Middleware
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost',
  'http://127.0.0.1'
];

if (process.env.DEV_ORIGIN) {
  allowedOrigins.push(process.env.DEV_ORIGIN);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 
    || /\.cloudworkstations\.dev$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Standard middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator: (req, res) => {
  //   // Use the client's IP from the 'X-Forwarded-For' header, or fall back to the direct IP.
  //   // This is crucial for environments behind a proxy (like Docker).
  //   const forwardedIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null;
  //   return forwardedIp || req.ip;
  // },
});
app.use('/api/', apiLimiter);

const startServer = async () => {
  try {
    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET is not defined in .env. Application cannot start.');
    }

    const redisClient = await getRedisClient();
    if (!redisClient) {
      throw new Error("Failed to connect to Redis. Application cannot start.");
    }
    console.log("Redis client obtained successfully. Configuring session store...");

    // Use a variable to hold the imported module
    let RedisStore;
    try {
        const redisModule = await import('connect-redis');
        RedisStore = redisModule.default;
    } catch (err) {
        console.error("Failed to dynamically import connect-redis:", err);
        throw new Error("Could not load the session store. Application cannot start.");
    }
    
    app.use(
      session({
        store: new RedisStore({
          client: redisClient,
          prefix: 'sess:'
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: 60 * 60 * 1000,
          sameSite: 'lax',
        },
      })
    );

    // ==================================================================
    //   app.get('/api/check-ip', (req, res) => {
    //     res.json({
    //         message: "IP Debugging",
    //         ip_seen_by_express: req.ip, // This is what Rate Limit uses
    //         x_forwarded_for: req.headers['x-forwarded-for'] || 'Not present'
    //     });
    // });
    // ==================================================================
    // Register API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/menu', menuRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', captchaRoutes);

    // 404 and Error Handlers
    app.use((req, res, next) => {
      res.status(404).json({ message: "Not Found: The requested resource does not exist." });
    });

    app.use((err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Max 100KB.' });
        }
        return res.status(400).json({ message: err.message });
      }
      next(err);
    });

    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: err.message || 'Something broke!' });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (err) {
    console.error('Failed to start the server:', err.message);
    process.exit(1);
  }
};

startServer();