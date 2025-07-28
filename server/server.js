import express, { json, urlencoded } from 'express';
import pkg from 'mongoose';
const { connect, connection } = pkg;
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import serviceRoutes from './routes/services.js';
import leaderboardRoutes from './routes/leaderboard.js';
import notificationRoutes from './routes/notifications.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

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
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferCommands: false
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

// Connect to database
connectDB();

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

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
  // server.close(() => {
  //   process.exit(1);
  // });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
    connection.close();
  });
});

export default app;