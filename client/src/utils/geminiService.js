import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');

export const generateTrafficReportDescription = async (reportType, location, severity, photoBase64 = null) => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Ensure the description is within 250 words
    const words = text.split(' ');
    if (words.length > 250) {
      return words.slice(0, 250).join(' ') + '...';
    }

    return text;
  } catch (error) {
    console.error('Error generating AI description:', error);
    throw new Error('Failed to generate AI description. Please try again or write manually.');
  }
};

export const generateTrafficReportDescriptionWithPhoto = async (reportType, location, severity, photoFile) => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    // Generate content with image
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Ensure the description is within 250 words
    const words = text.split(' ');
    if (words.length > 250) {
      return words.slice(0, 250).join(' ') + '...';
    }

    return text;
  } catch (error) {
    console.error('Error generating AI description with photo:', error);
    throw new Error('Failed to generate AI description with photo. Please try again or write manually.');
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
