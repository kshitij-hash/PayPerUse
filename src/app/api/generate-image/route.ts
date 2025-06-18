//TODO: Fix this code
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality} from '@google/genai';

// Initialize Gemini API client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); // Add your Gemini API key to .env.local

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

 // Generate image content
 const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE
        ],
      }
    });
     if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates found in response");
  }

  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error("No content parts found in candidate");
  }

  let base64Data: string | undefined = undefined;
  const textParts: string[] = [];

  for (const part of candidate.content.parts) {
    if (part.inlineData && part.inlineData.data) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      base64Data = buffer.toString("base64");
      break; 
    } else if (part.text) {
      textParts.push(part.text);
    }
  }

  if (!base64Data) {
    const reason = textParts.join(" ").trim();
    const errorMessage = reason
      ? `API returned no image. Reason: ${reason}`
      : "No image data found in response parts.";
    throw new Error(errorMessage);
  }

  return NextResponse.json(
    { result: `data:image/jpeg;base64,${base64Data}` },
    { status: 200 }
  );
} catch (error) {
  console.error('Error in image generation service:', error);
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}
}
