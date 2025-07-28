import { body, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('contactNumber')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .isIn(['citizen', 'police', 'municipal', 'service_provider'])
    .withMessage('Invalid role specified')
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Report validation
export const validateReport = [
  body('type')
    .isIn(['accident', 'police', 'pothole', 'construction', 'congestion', 'closure', 'weather', 'vip'])
    .withMessage('Invalid report type'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Location address is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('severity')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid severity level')
];

// Service request validation
export const validateServiceRequest = [
  body('serviceType')
    .isIn(['ambulance', 'mechanic', 'petrol', 'puncture', 'rental', 'ev_charge', 'towing'])
    .withMessage('Invalid service type'),
  body('citizenName')
    .trim()
    .notEmpty()
    .withMessage('Citizen name is required'),
  body('citizenPhone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Location address is required'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('urgency')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid urgency level')
];

