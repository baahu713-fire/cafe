require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const helmet = require('helmet'); // For setting various security HTTP headers
const rateLimit = require('express-rate-limit'); // To limit repeated requests
const morgan = require('morgan'); // For HTTP request logging
const { getRedisClient } = require('./src/config/redis'); // Your async redis connection

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const captchaRoutes = require('./src/routes/captcha');

const app = express();

// --- 1. Essential Security & Logging Middleware (Top Level) ---

// Set security HTTP headers
app.use(helmet());

// Configure CORS for your specific production and development domains
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000', // Your production frontend
  'http://localhost:3000' // Your local dev frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200
};
// app.use(cors(corsOptions));
app.use(cors());

// HTTP request logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Standard middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply rate limiting to all /api/ routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter);


// --- 2. Asynchronous Server Startup Function ---
const startServer = async () => {
  try {
    // --- 3. Fail-Fast: Check for critical .env variables ---
    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET is not defined in .env. Application cannot start.');
    }

    // --- 4. Fail-Fast: Attempt Redis Connection ---
    const redisClient = await getRedisClient();
    if (!redisClient) {
      // This is the "fail-fast" logic.
      throw new Error("Failed to connect to Redis. Application cannot start.");
    }
    console.log("Redis client obtained successfully. Configuring session store...");

    // --- 5. Dynamically Import connect-redis ---
    const { default: RedisStore } = await import('connect-redis');
    
    // --- 6. Set up Session Middleware (now guaranteed to have a client) ---
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
          secure: process.env.NODE_ENV === 'production', // true in production
          httpOnly: true, // Prevents client-side JS from reading the cookie
          maxAge: 10 * 60 * 1000, // 10 minutes
          sameSite: 'lax', // Protects against CSRF
        },
      })
    );

    // --- 7. Register API Routes (after session) ---
    app.use('/api/auth', authRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/menu', menuRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', captchaRoutes);

    // --- 8. Register 404 and Error Handlers (at the end) ---

    // Handle 404 - Not Found
    app.use((req, res, next) => {
      res.status(404).json({ message: "Not Found: The requested resource does not exist." });
    });

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
      console.error(err.stack); // Log the full error to the console
      // Send a generic JSON error response
      res.status(500).json({ message: 'Something broke!' });
    });

    // --- 9. Start the Server ---
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (err) {
    // Catch any startup errors (like Redis failing to connect)
    console.error('Failed to start the server:', err.message);
    process.exit(1); // Exit the process with a failure code
  }
};

// --- Run the async start function ---
startServer();