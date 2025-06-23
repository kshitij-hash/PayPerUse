
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define models in order of preference
const MODELS = [
  "gemini-1.5-flash",  // Primary model (fastest)
  "gemini-1.5-pro",    // Fallback model 1 (more capable)
  "gemini-1.0-pro"     // Fallback model 2 (older but stable)
];

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Generate translation
    const result = await generateTranslation(text, targetLanguage);

    // Return the translated text
    return NextResponse.json({ result }, { status: 200 });
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

/**
 * Generate translation using Gemini API with model fallback and retry logic
 * @param text Text to translate
 * @param targetLanguage Language to translate to
 * @returns Translated text
 */
async function generateTranslation(text: string, targetLanguage: string): Promise<string> {
  // Create the prompt for translation
  const translationPrompt = `Translate the following text to ${targetLanguage}. Respond only with the translated text:\n\n${text}`;
  
  // Try each model with exponential backoff
  let translation = '';
  
  // Helper function to generate content with retry logic
  async function generateWithRetry(prompt: string): Promise<string> {
    for (const modelName of MODELS) {
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Trying model ${modelName} for translation, attempt ${retryCount + 1}`);
          
          // Configure the model with safety settings
          const model = genAI.getGenerativeModel({
            model: modelName,
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
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text() || 'No translation generated';
        } catch (error: any) {
          console.error(`Error with model ${modelName}, attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retrying with exponential backoff
            await sleep(retryDelay);
            retryDelay *= 2;
          }
        }
      }
    }
    
    throw new Error('All models failed to generate translation');
  }

  try {
    translation = await generateWithRetry(translationPrompt);
    return translation.trim();
  } catch (error) {
    console.error('Error generating translation:', error);
    throw error;
  }
}
