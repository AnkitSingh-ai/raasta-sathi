# Email Setup for OTP Functionality

## Prerequisites
- Gmail account (or other email service)
- App password (for Gmail, enable 2-factor authentication first)

## Configuration Steps

### 1. Create .env file
Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/raasta_sathi

# Email Configuration (for OTP functionality)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary Configuration (if using)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Other Configuration
CORS_ORIGIN=http://localhost:5173
```

### 2. Gmail Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Raasta Sathi" as the name
   - Copy the generated 16-character password
4. Use this app password in your `.env` file

### 3. Alternative Email Services
You can modify `server/utils/emailService.js` to use other email services:

#### SendGrid
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

#### AWS SES
```javascript
const transporter = nodemailer.createTransporter({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASS
  }
});
```

## Testing
1. Start the server: `npm start`
2. Try registering a new user
3. Check your email for the OTP
4. Verify the email with the OTP
5. Try the forgot password functionality

## Troubleshooting
- **Email not sending**: Check your email credentials and app password
- **OTP not working**: Verify the email service configuration
- **Rate limiting**: Gmail has daily sending limits for free accounts
- **Spam folder**: Check spam/junk folder for verification emails

## Security Notes
- Never commit your `.env` file to version control
- Use environment variables in production
- Consider using a dedicated email service for production apps
- Implement rate limiting for OTP requests
