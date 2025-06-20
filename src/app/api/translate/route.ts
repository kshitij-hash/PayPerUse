
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ''); // Add your Gemini API key to .env.local

// Maximum number of retries for API calls
const MAX_RETRIES = 2;

// Delay between retries (in milliseconds)
const BASE_DELAY = 1000;

/**
 * POST handler for /api/translate
 * Translates text using Google's Gemini API
 */
export async function POST(req: NextRequest) {
  try {
    // Check for payment header
    const paymentHeader = req.headers.get('X-PAYMENT') || req.headers.get('x-payment');
    
    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              maxAmountRequired: "50000",
              resource: "http://localhost:3000/api/translate",
              description: "Translation service",
              mimeType: "application/json",
              payTo: "0x9D9e34611ab141a704d24368E8C0E900FbE7b0DF", // Replace with your actual address
              maxTimeoutSeconds: 300,
              asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              extra: {
                name: "USDC",
                version: "2"
              }
            }
          ]
        },
        { status: 402 }
      );
    }
    
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

    // Configure the model - using gemini-1.5-flash instead of pro for higher rate limits on free tier
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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

    // Function to generate content with retry logic
    async function generateWithRetry(prompt: string, retries = 0): Promise<string> {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || 'No translation generated';
      } catch (error: any) {
        // Check if it's a rate limit error (429)
        if (error?.status === 429 && retries < MAX_RETRIES) {
          // Calculate exponential backoff delay
          const delay = BASE_DELAY * Math.pow(2, retries);
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry with incremented retry count
          return generateWithRetry(prompt, retries + 1);
        }
        
        // If max retries exceeded or different error, rethrow
        throw error;
      }
    }

    // Generate content for translation with retry logic
    const prompt = `Translate the following text to ${targetLanguage}. Respond only with the translated text:\n\n${text}`;
    const translation = await generateWithRetry(prompt);

    // Return the translated text
    return NextResponse.json({ result: translation }, { status: 200 });
  } catch (error: any) {
    console.error('Error in translation service:', error);
    
    // Provide more specific error messages based on error type
    if (error?.status === 429) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please try again later.', 
          details: 'The translation service is currently experiencing high demand. This may be due to free tier limitations.'
        },
        { status: 429 }
      );
    } else if (error?.status) {
      // Handle other HTTP errors
      return NextResponse.json(
        { error: `Translation service error: ${error.status} ${error.statusText || ''}` },
        { status: error.status }
      );
    } else {
      // Generic error
      return NextResponse.json(
        { error: 'Failed to translate text' },
        { status: 500 }
      );
    }
  }
}
