import { body, validationResult } from 'express-validator';

// Middleware to parse location JSON string before validation
export const parseLocation = (req, res, next) => {
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid location format' });
    }
  }
  next();
};

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

export const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['citizen', 'police', 'municipal', 'service_provider']).withMessage('Invalid role')
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateReport = [
  body('type').isIn(['accident', 'police', 'pothole', 'construction', 'congestion', 'closure', 'weather', 'vip']).withMessage('Invalid type'),
  body('description').trim().isLength({ min: 10, max: 1500 }).withMessage('Description must be 10–1500 characters'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('severity').isIn(['low', 'medium', 'high']).withMessage('Invalid severity')
];

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