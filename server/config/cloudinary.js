import { v2 as cloudinary } from 'cloudinary';

// Initialize with default/placeholder values
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

// Function to reconfigure Cloudinary with actual credentials
export function configureCloudinary(cloudName, apiKey, apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

export default cloudinary;
