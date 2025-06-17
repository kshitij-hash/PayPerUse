import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ''); // Add your Gemini API key to .env.local

/**
 * POST handler for /api/generate-image
 * Generates images using Google's Gemini API
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Image prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Configure the model - Using Gemini 1.5 Pro which supports image generation
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

    // Generate image content
    // Note: Gemini returns images in base64 format within markdown
    const result = await model.generateContent([
      `Generate an image based on this description: ${prompt}. Return the image directly without any text.`
    ]);
    const response = await result.response;
    const text = response.text();
    
    // Extract image data from response
    // The response might contain markdown with an embedded image like: ![image](data:image/jpeg;base64,ABC123...)
    const imageMatch = text.match(/!\[.*?\]\(data:image\/[^;]+;base64,([^\)]+)\)/);
    
    if (!imageMatch || !imageMatch[1]) {
      throw new Error("No image data returned from Gemini");
    }
    
    const base64Data = imageMatch[1];
    
    // For this example, we'll return the base64 data directly
    // In a production environment, you might want to save this to storage and return a URL
    return NextResponse.json({ 
      result: `data:image/jpeg;base64,${base64Data}` 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in image generation service:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
