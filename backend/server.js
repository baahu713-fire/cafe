require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { getRedisClient } = require('./src/config/redis');
const { UPLOAD_LIMITS } = require('./src/constants/uploadLimits');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const captchaRoutes = require('./src/routes/captcha');
const dailySpecialsRoutes = require('./src/routes/dailySpecialsRoutes');
const cmcRoutes = require('./src/routes/cmcRoutes');
const timeSlotRoutes = require('./src/routes/timeSlotRoutes');
const billRoutes = require('./src/routes/billRoutes');
const scheduledOrderRoutes = require('./src/routes/scheduledOrderRoutes');

const app = express();
app.set('trust proxy', 1);

// Security & Logging Middleware
app.use(helmet());

// Compression middleware - compress all responses
app.use(compression());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
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

// Rate limiting - Different limits for authenticated vs unauthenticated users
// Public rate limiter: Stricter for unauthenticated requests
// const publicLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requests per 15 min for unauthenticated users
//   message: 'Too many requests. Please try again after 15 minutes.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => req.session?.user, // Skip if user is authenticated
// });

// Authenticated rate limiter: More generous for logged-in users
// const authenticatedLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 3000, // 3000 requests per 15 min for authenticated users
//   message: 'Rate limit exceeded. Please slow down.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => !req.session?.user, // Skip if NOT authenticated
// });

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  // Dynamic limit based on session status
  max: (req) => {
    if (req.session?.user) return 3000; // Authenticated limit
    return 100; // Public limit
  },
  // Dynamic message based on session status
  message: (req) => {
    if (req.session?.user) return 'Rate limit exceeded. Please slow down.';
    return 'Too many requests. Please try again after 15 minutes.';
  },
  // Optional: Use User ID for key if logged in, otherwise IP
  // keyGenerator: (req) => {
  //   return req.session?.user?.id || req.ip;
  // }
});


// Apply both limiters - order matters, authenticated first
// app.use('/api/', authenticatedLimiter);
// app.use('/api/', publicLimiter);

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

    app.use('/api/', apiLimiter);
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
    app.use('/api/daily-specials', dailySpecialsRoutes);
    app.use('/api/cmc', cmcRoutes);
    app.use('/api/time-slots', timeSlotRoutes);
    app.use('/api/bills', billRoutes);
    app.use('/api/scheduled-orders', scheduledOrderRoutes);

    // 404 and Error Handlers
    app.use((req, res, next) => {
      res.status(404).json({ message: "Not Found: The requested resource does not exist." });
    });

    app.use((err, req, res, next) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxSizeKB = req.uploadMaxSize ? Math.round(req.uploadMaxSize / 1024) : Math.round(UPLOAD_LIMITS.DEFAULT / 1024);
          return res.status(400).json({ message: `File is too large. Maximum allowed size is ${maxSizeKB}KB.` });
        }
        return res.status(400).json({ message: err.message });
      }
      // Handle custom multer file filter errors
      if (err.message && err.message.includes('image files')) {
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