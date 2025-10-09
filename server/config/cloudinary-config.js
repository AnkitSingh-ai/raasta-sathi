// Cloudinary Configuration
// You need to create a .env file in the server directory with these variables:

/*
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
*/

// Or set them directly in your environment/system

export const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
};

// Instructions:
// 1. Sign up at https://cloudinary.com/
// 2. Get your credentials from Dashboard
// 3. Create a .env file in server directory
// 4. Add your credentials to .env file
// 5. Restart your server
