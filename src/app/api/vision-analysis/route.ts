import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Fetches an image from a URL and converts it into a format suitable for the Gemini API.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves to a GenerativePart object.
 */
async function urlToGenerativePart(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(`URL did not point to a valid image. Content-Type: ${contentType}`);
  }
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: contentType,
    },
  };
}

/**
 * POST handler for /api/vision-analysis
 * Analyzes an image using a single, simple call to the Google Gemini Vision API.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse the request body to get the image URL and optional prompt.
    const body = await req.json();
    console.log(body)
    const { imageUrl, prompt } = body || {};

    // 2. Validate that the image URL is present.
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required and must be a string.' },
        { status: 400 }
      );
    }

    // 3. Prepare and execute the request to the Gemini API.
    const modelName = "gemini-2.5-flash";
    const imagePart = await urlToGenerativePart(imageUrl);
    const textPrompt = prompt || 'Describe this image in detail.';

    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: textPrompt }, imagePart] }]
    });

    const analysisResult = response.text || 'No analysis generated';

    // 4. Return the generated analysis in the response.
    return NextResponse.json({ output: analysisResult }, { status: 200 });

  } catch (error) {
    // 5. Handle any errors that occur during the process.
    console.error('Error in vision analysis service:', error);
    const errorDetails = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: 'Failed to analyze image.', details: errorDetails },
      { status: 500 }
    );
  }
}
