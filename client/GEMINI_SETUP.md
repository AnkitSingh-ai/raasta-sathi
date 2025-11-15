# Gemini AI Integration Setup

## Overview
This application now includes AI-powered description generation for traffic reports using Google's Gemini AI. The AI can analyze report details and photos to generate professional, detailed descriptions up to 500 words.

## Features
- **Smart Description Generation**: AI creates structured descriptions based on report type, location, severity, and photos
- **Photo Analysis**: When photos are uploaded, AI analyzes visual content for better descriptions
- **Structured Format**: Descriptions use clear headings and organized sections for better readability
- **Manual Override**: Users can still write descriptions manually or edit AI-generated ones
- **Flexible Limits**: 1500 characters maximum with 250 words maximum for optimal content balance

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env` file in the client directory:

```bash
# client/.env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Note**: This project uses Vite, so environment variables must be prefixed with `VITE_` to be accessible in the browser.

### 3. Install Dependencies
The required dependency has been added to package.json:

```bash
npm install
```

### 4. Restart Development Server
After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Usage

### For Users
1. **Fill Required Fields**: Select report type, enter location, and select severity
2. **Generate AI Description**: Click "Generate AI Description" button
3. **Review & Choose**: 
   - Use AI description as-is
   - Edit AI description before using
   - Regenerate if needed
4. **Manual Override**: Always write your own description if preferred

### Description Format
AI-generated descriptions follow a structured format for better readability:

```
INCIDENT TYPE
[Description of what happened]

LOCATION DETAILS
[Specific location information]

TRAFFIC IMPACT
[How this affects traffic flow]

SAFETY CONCERNS
[Any safety issues or warnings]

RECOMMENDATIONS
[What drivers should do]
```

This format makes reports easy to read and understand quickly.

### Content Limits
- **Character Limit**: Maximum 1500 characters
- **Word Limit**: Maximum 250 words
- **Purpose**: Allows detailed descriptions while maintaining readability
- **AI Generation**: Automatically respects both limits
- **Manual Input**: Users can write longer text but must stay within word limit

### AI Generation Process
1. **Text-based**: Uses report type (accident, jam, closure, etc.), location, and severity for context
2. **Photo-enhanced**: If photos are uploaded, AI analyzes visual content
3. **Structured Format**: Creates organized descriptions with clear headings and sections
4. **Professional Tone**: Generates informative, objective descriptions
5. **Safety Focused**: Emphasizes traffic impact and safety concerns
6. **Content Limits**: Limited to 250 words and 1500 characters for optimal readability

## Technical Details

### API Endpoints
- Uses Gemini 2.0 Flash Experimental model for optimal performance
- Handles both text-only and image+text generation
- Automatic word limit enforcement (250 words max, 1500 characters max)
- Structured format with clear headings and sections

### Error Handling
- Graceful fallback if AI generation fails
- User-friendly error messages
- Manual description option always available

### Performance
- Fast generation with Gemini 2.0 Flash Experimental
- Optimized for mobile and desktop use
- Minimal API calls (only when requested)

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure `.env` file is in client directory
2. **Generation Fails**: Check internet connection and API key validity
3. **Photo Analysis Issues**: Ensure photos are valid image files
4. **"process is not defined" Error**: Ensure environment variable uses `VITE_` prefix (e.g., `VITE_GEMINI_API_KEY`)

### Support
If you encounter issues:
1. Check browser console for error messages
2. Verify API key is correctly set
3. Ensure report type, location, and severity are filled before generation

## Security Notes
- API key is stored in client-side environment variables
- No sensitive data is sent to external services
- All user data remains within the application
