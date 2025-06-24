import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client with the API key from environment variables.
// Ensure GEMINI_API_KEY is set in your .env.local file.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * POST handler for /api/text-generation
 * Generates text using a single, simple call to the Google Gemini API.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse the request body to get the input prompt.
    const { input } = await req.json();
    console.log('Input:', input);

    // 2. Validate that the input is present and is a string.
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required and must be a string.' },
        { status: 400 }
      );
    }

    // 3. Prepare and execute the request to the Gemini API.
    const modelName = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: input }] }]
    });
    console.log('Response:', response);

    const generatedText = response.text || 'No text generated';
    console.log('Generated Text:', generatedText);

    // 4. Return the generated text in the response.
    return NextResponse.json({ output: generatedText }, { status: 200 });

  } catch (error) {
    // 5. Handle any errors that occur during the process.
    console.error('Error in text generation service:', error);
    
    const errorDetails = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: 'Failed to generate text.', details: errorDetails },
      { status: 500 }
    );
  }
}

