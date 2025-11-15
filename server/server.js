import express, { json, urlencoded } from 'express';
import pkg from 'mongoose';
const { connect, connection } = pkg;
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

// Configure Cloudinary after environment variables are loaded
import cloudinary, { configureCloudinary } from './config/cloudinary.js';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  configureCloudinary(cloudName, apiKey, apiSecret);
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️ Cloudinary credentials not found, using default configuration');
}

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import serviceRoutes from './routes/services.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationRoutes from './routes/notifications.js';

// Import services
import cronService from './utils/cronService.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Trust proxy for Render deployment (needed for rate limiting and correct IP detection)
app.set('trust proxy', 1);

// Comprehensive CORS configuration for all routes
// Allow configuration via environment variables for deployment platforms (Render, Vercel, etc.)
// "FRONTEND_URL" is the public URL where the client is hosted (e.g. https://raasta-sathi.vercel.app)
// "ALLOWED_ORIGINS" can be a comma-separated list of additional allowed origins.
const envAllowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'https://raasta-sathi.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...envAllowed
];

// CORS configuration function
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For production, be more permissive - allow any origin that matches common patterns
      // This helps with Render and other deployment platforms
      if (process.env.NODE_ENV === 'production') {
        // Allow any https origin in production (you can restrict this further if needed)
        if (origin.startsWith('https://')) {
          console.log('⚠️  Allowing origin in production:', origin);
          return callback(null, true);
        }
      }
      
      console.log('❌ CORS blocked origin:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['*'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Enhanced CORS test endpoint
app.get('/cors-test-image', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  res.json({ 
    message: 'CORS is working for images!',
    timestamp: new Date().toISOString(),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    }
  });
});

// Security middleware
app.use(helmet());
app.use(compression());


// Rate limiting - more lenient for development
// Configure for Render proxy (trust proxy)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy for Render deployment - skip X-Forwarded-For validation
  validate: false // Disable validation to avoid ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on Render
});

// Apply rate limiting to all routes except health check
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for health check and test endpoints
  if (req.path === '/health' || req.path === '/test') {
    return next();
  }
  return limiter(req, res, next);
});

// Body parsing middleware
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically with wildcard CORS (no credentials needed for images)
app.use('/uploads', (req, res, next) => {
  // For static files, we can safely use wildcard since no credentials are needed
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// Increase timeout for file uploads
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 minutes timeout
  res.setTimeout(120000); // 2 minutes timeout
  next();
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('⚠️  MongoDB URI not provided. Server will run without database connection.');
      console.log('   To connect to MongoDB, set MONGODB_URI in your .env file');
      console.log('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/raasta-sathi');
      return;
    }

    console.log('🔄 Connecting to MongoDB...');
    console.log('   URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in log

    const conn = await connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferCommands: true // Enable command buffering while connecting
    });

    console.log('✅ Connected to MongoDB:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Connection refused. Please check:');
      console.log('   1. Your MongoDB Atlas cluster is running');
      console.log('   2. Your IP address is whitelisted in MongoDB Atlas');
      console.log('   3. Your username and password are correct');
      console.log('   4. Your connection string is properly formatted');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed. Please check:');
      console.log('   1. Your username and password are correct');
      console.log('   2. The user has proper database permissions');
    } else if (error.message.includes('ServerSelectionTimeoutError')) {
      console.log('💡 Server selection timeout. Please check:');
      console.log('   1. Your internet connection');
      console.log('   2. MongoDB Atlas cluster is accessible');
      console.log('   3. Firewall settings allow MongoDB connections');
    }
    
    console.log('⚠️  Server will continue running without database connection');
    console.log('   Some features may not work properly');
  }
};

// Connect to database and start server only after connection
const startServer = async () => {
  try {
    await connectDB();
    
    // Start cron service after database connection
    setTimeout(() => {
      try {
        cronService.start();
        console.log('⏰ Cron service initialized');
      } catch (error) {
        console.error('❌ Failed to start cron service:', error);
      }
    }, 2000); // Wait 2 seconds for database to be ready
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 API available at: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
      // Don't exit the process, just log the error
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('💤 Process terminated');
        connection.close();
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Special route for image files with enhanced CORS
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  // Set CORS headers for images (wildcard is fine for static files)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Send file with proper headers
  res.sendFile(filePath);
});

// Test endpoint for CORS debugging
app.get('/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  console.log('🔍 Testing image access for:', filename);
  console.log('📁 File path:', filePath);
  console.log('📁 File exists:', fs.existsSync(filePath));
  
  // Set comprehensive CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: 'Image not found',
      filename,
      filePath,
      exists: false
    });
  }
  
  // Get file stats
  const stats = fs.statSync(filePath);
  console.log('📊 File stats:', {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  });
  
  res.json({
    success: true,
    filename,
    filePath,
    exists: true,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'success',
    message: 'Raasta Sathi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      status: dbStatus,
      name: connection.name || 'not connected',
      host: connection.host || 'not connected'
    }
  });
});

// Test endpoint for frontend connectivity
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is working! Frontend can connect to the API.',
    timestamp: new Date().toISOString()
  });
});

// Root route - helpful when someone opens the backend URL in a browser
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Raasta Sathi backend is running. Use the /api/* endpoints.',
    api: {
      health: '/api/health',
      test: '/api/test'
    },
    frontend: process.env.FRONTEND_URL || null
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

export default app;