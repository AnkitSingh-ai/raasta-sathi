# 🚀 Cloudinary Integration Setup Guide

## 📋 Prerequisites

1. **Cloudinary Account**: Sign up at [https://cloudinary.com/](https://cloudinary.com/)
2. **Node.js**: Version 14 or higher
3. **npm**: For package management

## 🔑 Step 1: Get Cloudinary Credentials

1. **Login to Cloudinary Dashboard**
   - Go to [https://cloudinary.com/console](https://cloudinary.com/console)
   - Sign in to your account

2. **Copy Your Credentials**
   - **Cloud Name**: Found in the top-left corner of your dashboard
   - **API Key**: Click "Show" next to API Key
   - **API Secret**: Click "Show" next to API Secret

## ⚙️ Step 2: Configure Environment Variables

### Option A: Create .env file (Recommended)

Create a `.env` file in the `server/` directory:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret

# MongoDB Configuration
MONGODB_URI=mongodb+srv://***:***@cluster0.68telww.mongodb.net/raasta-sathi

# Server Configuration
PORT=5002
NODE_ENV=development
```

### Option B: Set Environment Variables Directly

```bash
# macOS/Linux
export CLOUDINARY_CLOUD_NAME="your_actual_cloud_name"
export CLOUDINARY_API_KEY="your_actual_api_key"
export CLOUDINARY_API_SECRET="your_actual_api_secret"

# Windows (Command Prompt)
set CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
set CLOUDINARY_API_KEY=your_actual_api_key
set CLOUDINARY_API_SECRET=your_actual_api_secret

# Windows (PowerShell)
$env:CLOUDINARY_CLOUD_NAME="your_actual_cloud_name"
$env:CLOUDINARY_API_KEY="your_actual_api_key"
$env:CLOUDINARY_API_SECRET="your_actual_api_secret"
```

## 🚀 Step 3: Install Dependencies

The required packages are already installed:
- `cloudinary`: Cloudinary SDK
- `multer-storage-cloudinary`: Multer storage engine for Cloudinary
- `dotenv`: Environment variable loader

## 🔧 Step 4: Restart Your Server

After setting up the environment variables:

```bash
# Stop your current server (Ctrl+C)
# Then restart
npm start
```

## ✅ Step 5: Verify Integration

1. **Check Server Logs**: Look for Cloudinary configuration messages
2. **Upload an Image**: Create a new report with a photo
3. **Check Database**: Verify the photo URL is a Cloudinary URL
4. **View Image**: The image should load without CORS issues

## 🌟 Benefits of Cloudinary Integration

- ✅ **No More CORS Issues**: Images served from Cloudinary CDN
- ✅ **Better Performance**: Global CDN distribution
- ✅ **Image Optimization**: Automatic resizing and compression
- ✅ **Scalable Storage**: Unlimited cloud storage
- ✅ **Reliable**: 99.9% uptime guarantee
- ✅ **Cost-Effective**: Generous free tier

## 🔍 Troubleshooting

### Issue: "Cloudinary configuration error"
**Solution**: Check your environment variables are set correctly

### Issue: "Upload failed"
**Solution**: Verify your Cloudinary credentials and internet connection

### Issue: "Image not displaying"
**Solution**: Check the photo URL in the database - should be a Cloudinary URL

## 📱 Cloudinary Dashboard Features

- **Media Library**: View all uploaded images
- **Transformations**: Apply filters, resizing, cropping
- **Analytics**: Track image usage and performance
- **Settings**: Configure upload presets and restrictions

## 💰 Pricing

- **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Paid Plans**: Starting from $89/month for higher limits
- **Pay-as-you-go**: Additional usage beyond free tier

## 🆘 Support

- **Cloudinary Docs**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Community**: [https://support.cloudinary.com/](https://support.cloudinary.com/)
- **GitHub**: [https://github.com/cloudinary](https://github.com/cloudinary)

---

**🎉 Congratulations!** Your app now uses Cloudinary for professional image management.
