import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get fresh Gemini AI instance with current API key
const getGeminiAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('🔄 Creating new Gemini AI instance with API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'none');
  return new GoogleGenerativeAI(apiKey || 'your-api-key-here');
};

// Local deterministic fallback when Gemini is unavailable or a model is not found.
const generateLocalDescription = (reportType, location, severity, hasPhoto = false) => {
  const severityText = severity === 'high'
    ? 'High severity — immediate attention required. Multiple vehicles or major obstruction affecting traffic flow.'
    : severity === 'low'
      ? 'Low severity — minor disruption or hazard, traffic flowing with minimal delays.'
      : 'Moderate severity — some delays expected, exercise caution.';

  const photoNote = hasPhoto ? 'A photo was provided with this report; include visual cues where applicable.' : '';

  return [
    'INCIDENT TYPE',
    `${reportType}`,
    '',
    'LOCATION DETAILS',
    `${location || 'Location not specified'}`,
    '',
    'TRAFFIC IMPACT',
    `${severityText}`,
    '',
    'SAFETY CONCERNS',
    'Use caution when approaching the area. Follow traffic signs and any directions from authorities.',
    '',
    'RECOMMENDATIONS',
    `Drivers should slow down, consider alternative routes, and avoid stopping in the affected lanes. ${photoNote}`
  ].join('\n');
};

export const generateTrafficReportDescription = async (reportType, location, severity, photoBase64 = null) => {
  try {
    console.log('🚀 Starting AI description generation with updated Gemini service v2.0');
    
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('🔑 API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      isDefault: apiKey === 'your-api-key-here'
    });
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      console.warn('Gemini API key not configured. Falling back to local description generator.');
      return generateLocalDescription(reportType, location, severity, !!photoBase64);
    }
    
    console.log('✅ API key found, proceeding with model selection...');

    // Try different models in order of preference
    // Using stable model names that are more likely to be available
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let model = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`Attempting to use Gemini model: ${modelName}`);
        const genAI = getGeminiAI(); // Get fresh instance
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`✅ Model ${modelName} initialized successfully`);
        break;
      } catch (error) {
        console.warn(`❌ Model ${modelName} initialization failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!model) {
      console.warn('No available Gemini models found. Falling back to local description generator.', lastError);
      return generateLocalDescription(reportType, location, severity, !!photoBase64);
    }

    // Prepare the prompt for traffic report description
    let prompt = `Generate a structured, professional traffic report description based on the following information:

Report Type: ${reportType}
Location: ${location}
Severity Level: ${severity}

Please create a well-organized description with the following structure:
- Use clear headings in CAPS on separate lines
- Put detailed information below each heading
- Keep each section concise and informative
- Use professional and objective tone
- Maximum 250 words total
- Add proper spacing after headings and between sections
- Use clear, readable language

Structure should be:
INCIDENT TYPE
[Description of what happened with proper spacing and punctuation]

LOCATION DETAILS
[Specific location information with clear details]

TRAFFIC IMPACT
[How this affects traffic flow with specific details]

SAFETY CONCERNS
[Any safety issues or warnings with actionable advice]

RECOMMENDATIONS
[What drivers should do with clear instructions]

Format the text to be easily readable with proper spacing between sections.`;

    // If photo is provided, add it to the prompt
    if (photoBase64) {
      prompt += `\n\nA photo has been uploaded with this report. Please analyze the visual content and incorporate relevant details from the image into the description.`;
    }

    // Generate content with timeout
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI generation timeout after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    // Check if result is valid
    if (!result || !result.response) {
      throw new Error('Invalid response from AI model');
    }
    
    const response = result.response;
    
    // Check if response has text method
    if (!response || typeof response.text !== 'function') {
      throw new Error('Invalid response format from AI model');
    }
    
    const text = response.text();

    // Ensure the description is within 250 words
    const words = text.split(' ');
    if (words.length > 250) {
      return words.slice(0, 250).join(' ') + '...';
    }

    return text;
  } catch (error) {
    console.error('Error generating AI description:', error);
    // Log detailed error for debugging
    if (error.message) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    // If Gemini/remote model fails, return a deterministic local description instead of throwing so UI can still show useful text.
    return generateLocalDescription(reportType, location, severity, !!photoBase64);
  }
};

export const generateTrafficReportDescriptionWithPhoto = async (reportType, location, severity, photoFile) => {
  try {
    console.log('🚀 Starting AI description generation with photo using updated Gemini service v2.0');
    
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('🔑 API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      isDefault: apiKey === 'your-api-key-here'
    });
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      console.warn('Gemini API key not configured. Falling back to local description generator (with photo).');
      return generateLocalDescription(reportType, location, severity, true);
    }
    
    console.log('✅ API key found, proceeding with model selection...');

    // Try different models in order of preference
    // Using stable model names that are more likely to be available
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let model = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`Attempting to use Gemini model: ${modelName}`);
        const genAI = getGeminiAI(); // Get fresh instance
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`✅ Model ${modelName} initialized successfully`);
        break;
      } catch (error) {
        console.warn(`❌ Model ${modelName} initialization failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!model) {
      console.warn('No available Gemini models found. Falling back to local description generator (with photo).', lastError);
      return generateLocalDescription(reportType, location, severity, true);
    }

    // Convert photo to base64 for Gemini
    const base64Image = await fileToBase64(photoFile);

    // Create image part
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
        mimeType: photoFile.type
      }
    };

    // Prepare the prompt
    const prompt = `Analyze this traffic incident photo and generate a structured, professional traffic report description.

Report Type: ${reportType}
Location: ${location}
Severity Level: ${severity}

Please create a well-organized description with the following structure:
- Use clear headings in CAPS on separate lines
- Put detailed information below each heading
- Keep each section concise and informative
- Use professional and objective tone
- Maximum 250 words total
- Add proper spacing after headings and between sections
- Use clear, readable language

Structure should be:
INCIDENT TYPE
[Description of what happened based on photo analysis with proper spacing and punctuation]

LOCATION DETAILS
[Specific location information with clear details]

TRAFFIC IMPACT
[How this affects traffic flow with specific details]

SAFETY CONCERNS
[Any safety issues or warnings visible in photo with actionable advice]

RECOMMENDATIONS
[What drivers should do with clear instructions]

Format the text to be easily readable with proper spacing between sections.`;

    // Generate content with image and timeout
    const generatePromise = model.generateContent([prompt, imagePart]);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI generation timeout after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    // Check if result is valid
    if (!result || !result.response) {
      throw new Error('Invalid response from AI model');
    }
    
    const response = result.response;
    
    // Check if response has text method
    if (!response || typeof response.text !== 'function') {
      throw new Error('Invalid response format from AI model');
    }
    
    const text = response.text();

    // Ensure the description is within 250 words
    const words = text.split(' ');
    if (words.length > 250) {
      return words.slice(0, 250).join(' ') + '...';
    }

    return text;
  } catch (error) {
    console.error('Error generating AI description with photo:', error);
    // Log detailed error for debugging
    if (error.message) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    // Fall back to deterministic generator so user still receives a usable description
    return generateLocalDescription(reportType, location, severity, true);
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
