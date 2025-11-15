# Raasta Sathi Backend API

A comprehensive Node.js backend for the Raasta Sathi traffic intelligence platform.

## Features

- **User Management**: Registration, authentication, and role-based access control
- **Traffic Reporting**: Create, verify, and manage traffic incident reports
- **Service Requests**: Emergency service coordination between citizens and providers
- **Real-time Notifications**: Push notifications for nearby incidents and service updates
- **Leaderboard System**: Gamification with points, badges, and achievements
- **Geospatial Queries**: Location-based search and nearby service provider matching
- **File Upload Support**: Image attachments for reports and service requests

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary (optional)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other configurations
   ```

3. **Start the Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

4. **Seed Sample Data** (Optional)
   ```bash
   node utils/seedData.js
   ```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/raasta-sathi
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Reports
- `GET /api/reports` - Get all reports (with filters)
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/like` - Like/unlike report
- `POST /api/reports/:id/comments` - Add comment
- `POST /api/reports/:id/vote` - Vote on report
- `POST /api/reports/:id/verify` - Verify report (Authority only)

### Service Requests
- `GET /api/services` - Get service requests
- `POST /api/services` - Create service request
- `GET /api/services/:id` - Get single request
- `POST /api/services/:id/accept` - Accept request (Provider)
- `POST /api/services/:id/start` - Start service
- `POST /api/services/:id/complete` - Complete service
- `POST /api/services/:id/cancel` - Cancel request
- `POST /api/services/:id/messages` - Add message
- `POST /api/services/:id/rate` - Rate service

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/notifications` - Update notification settings
- `PUT /api/users/availability` - Update provider availability
- `GET /api/users/providers/nearby` - Get nearby providers

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/stats/:userId` - Get user statistics
- `GET /api/leaderboard/achievements` - Get available achievements

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Database Models

### User
- Personal information and authentication
- Role-based permissions (citizen, police, municipal, service_provider)
- Gamification data (points, badges, achievements)
- Notification preferences
- Service provider specific fields

### Report
- Traffic incident details
- Location with geospatial indexing
- Status tracking and verification
- User engagement (likes, comments, votes)
- Media attachments

### ServiceRequest
- Emergency service coordination
- Real-time status tracking
- Communication between citizen and provider
- Rating and feedback system

### Notification
- Real-time user notifications
- Type-based categorization
- Read/unread status tracking

## Security Features

- JWT-based authentication
- Role-based access control
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Helmet security headers

## Deployment

The API is designed to work with any MongoDB hosting service. Simply update the `MONGODB_URI` environment variable with your database connection string.

### Deploying to Render

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `https://github.com/AnkitSingh-ai/raasta-sathi`
   - Configure the service:
     - **Name**: `raasta-sathi-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
     - **Root Directory**: Leave empty (or use `server` if deploying only server)

3. **Set Environment Variables**
   In the Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   PORT=5002
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d
   FRONTEND_URL=https://raasta-sathi.vercel.app
   ALLOWED_ORIGINS=https://raasta-sathi.vercel.app,https://your-render-url.onrender.com
   ```
   
   Optional (if using):
   ```
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   GEMINI_API_KEY=your_gemini_api_key
   ```

   **Important for Email/OTP:**
   - For Gmail: Enable 2FA and generate an App Password
   - OTPs are always logged to Render logs (even if email fails)
   - To view OTPs: Go to Render Dashboard → Your Service → Logs tab
   - Search for "OTP Code" in the logs to find verification codes

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your API will be available at: `https://your-service-name.onrender.com`

5. **Update Frontend API URL**
   - Update `VITE_API_URL` in your frontend `.env` to point to your Render URL
   - Example: `VITE_API_URL=https://your-service-name.onrender.com/api`

### Alternative: Using render.yaml
If you have a `render.yaml` file in your repository, Render can automatically configure your service:
- Push the `render.yaml` file to your repository
- In Render dashboard, select "Apply render.yaml" when creating the service
- Set the environment variables marked as `sync: false` in the dashboard

### Recommended Hosting
- **Database**: MongoDB Atlas
- **API**: Render, Heroku, Railway, or DigitalOcean
- **File Storage**: Cloudinary (for images)
- **Frontend**: Vercel, Netlify, or Render

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details