import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ''); // Add your Gemini API key to .env.local

/**
 * POST handler for /api/translate
 * Translates text using Google's Gemini API
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { text, targetLanguage } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text to translate is required and must be a string' },
        { status: 400 }
      );
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return NextResponse.json(
        { error: 'Target language is required and must be a string' },
        { status: 400 }
      );
    }

    // Configure the model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Generate content for translation
    const prompt = `Translate the following text to ${targetLanguage}. Respond only with the translated text:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text() || 'No translation generated';

    // Return the translated text
    return NextResponse.json({ result: translation }, { status: 200 });
  } catch (error) {
    console.error('Error in translation service:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
