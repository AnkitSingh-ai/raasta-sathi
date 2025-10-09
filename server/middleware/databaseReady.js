import pkg from 'mongoose';
const { connection } = pkg;

// Middleware to check if database is ready
export const checkDatabaseReady = (req, res, next) => {
  // Check if MongoDB connection is ready
  if (connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection not ready. Please try again in a moment.',
      code: 'DATABASE_NOT_READY'
    });
  }
  next();
};

// Middleware to check if database is connected (more strict)
export const requireDatabaseConnection = (req, res, next) => {
  if (connection.readyState !== 1) {
    console.error('❌ Database not connected. Ready state:', connection.readyState);
    return res.status(503).json({
      status: 'error',
      message: 'Service temporarily unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
};
