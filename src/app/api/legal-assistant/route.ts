import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Define models in order of preference
const MODELS = [
  "gemini-2.5-flash",  // Primary model (newest and fastest)
  "gemini-1.5-flash",  // Fallback model 1
  "gemini-1.5-pro"     // Fallback model 2 (more capable but with stricter rate limits)
];

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST handler for /api/legal-assistant
 * Provides legal information and assistance using Google's Gemini API
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
              maxAmountRequired: "100000",
              resource: "https://flow-nu-two.vercel.app/api/legal-assistant",
              description: "Legal Assistant service",
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

    // Parse request body
    const body = await req.json();
    const { query, jurisdiction } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Legal query is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate legal information
    const result = await generateLegalInfo(query, jurisdiction);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating legal information:', error);
    return NextResponse.json(
      { error: 'Failed to generate legal information', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate legal information using Gemini API
 */
async function generateLegalInfo(
  query: string,
  jurisdiction?: string
): Promise<{
  information: string;
  jurisdiction: string;
  relevantLaws: string[];
  disclaimer: string;
}> {
  // Define jurisdictions with their legal system types
  const jurisdictionInfo = {
    "Global (International Law)": "international treaties and conventions",
    "United States": "common law system with federal and state jurisdictions",
    "European Union": "civil law system with EU regulations and directives",
    "United Kingdom": "common law system with statutory law",
    "Canada": "bijural system with common law and civil law (Quebec)",
    "Australia": "common law system with federal and state jurisdictions",
    "India": "common law system with constitutional supremacy",
    "China": "civil law system with socialist legal characteristics",
    "Japan": "civil law system with influences from German and French legal systems",
    "Brazil": "civil law system based on Portuguese law",
    "South Africa": "mixed legal system with common law, civil law, and customary law",
    "Russia": "civil law system with elements from socialist legal tradition",
    "Germany": "civil law system with focus on codified statutes",
    "France": "civil law system with emphasis on written codes"
  };

  // Get jurisdiction context
  const jurisdictionContext = jurisdiction && jurisdiction in jurisdictionInfo 
    ? jurisdictionInfo[jurisdiction as keyof typeof jurisdictionInfo]
    : "various legal systems worldwide";

  // Create the prompt for legal information generation
  const legalPrompt = `You are an expert legal assistant with deep knowledge of legal systems worldwide. 
  Provide comprehensive information about the following legal query:

  Query: "${query}"
  ${jurisdiction ? `Jurisdiction: ${jurisdiction} (${jurisdictionContext})` : 'Jurisdiction: Global (considering various legal systems worldwide)'}

  IMPORTANT: Your response MUST be a valid JSON object with the following structure and nothing else:
  {
    "information": "Detailed answer to the legal query with well-structured paragraphs",
    "relevantLaws": ["List of relevant laws, statutes, codes, or regulations"],
    "disclaimer": "A brief legal disclaimer about the information provided"
  }

  IMPORTANT GUIDELINES:
  1. Provide factual information about relevant laws, regulations, and legal principles.
  2. Structure your response with clear organization and concise paragraphs.
  3. Include references to specific laws or legal codes when applicable.
  4. If the query involves multiple jurisdictions, compare the approaches.
  5. If you're uncertain about specific details, clearly indicate this.
  6. Do not provide personalized legal advice - only general legal information.
  7. Your entire response must be ONLY valid JSON - no other text before or after the JSON.
  8. Do not include any markdown formatting, code blocks, or other non-JSON content.

  Remember to maintain accuracy and objectivity in your response.`;

  // Helper function to generate content with retry logic
  async function generateWithRetry(prompt: string): Promise<string> {
    for (const modelName of MODELS) {
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Trying model ${modelName} for legal query, attempt ${retryCount + 1}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          
          return response.text || '';
        } catch (error) {
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
    
    throw new Error('All models failed to generate legal information');
  }

  try {
    const response = await generateWithRetry(legalPrompt);
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // More robust JSON extraction
      // First try to find JSON between curly braces
      let jsonString = response;
      
      // Remove any markdown code block markers
      jsonString = jsonString.replace(/```json|```/g, '').trim();
      
      // Try to find the outermost JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/m);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      // Clean up common JSON formatting issues
      // Replace escaped quotes that might cause issues
      jsonString = jsonString.replace(/\\\"([^\"]*)\\\"/g, '"$1"');
      
      // Try to parse the JSON
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (initialError) {
        console.log('Initial JSON parse failed, attempting cleanup:', initialError);
        
        // Try more aggressive cleanup for malformed JSON
        // Replace any unescaped newlines inside strings
        jsonString = jsonString.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
        
        // Fix trailing commas in arrays and objects
        jsonString = jsonString.replace(/,\s*([\]\}])/g, '$1');
        
        // Try parsing again after cleanup
        parsedResponse = JSON.parse(jsonString);
      }
    } catch (parseError) {
      console.error('Error parsing JSON response after all attempts:', parseError);
      console.log('Raw response:', response);
      
      // If JSON parsing fails, extract useful information from the text
      const informationMatch = response.match(/information["']?\s*:\s*["']([^"']+)["']/i);
      const disclaimerMatch = response.match(/disclaimer["']?\s*:\s*["']([^"']+)["']/i);
      
      // Return a structured response even if parsing failed
      return {
        information: informationMatch ? informationMatch[1] : response,
        jurisdiction: jurisdiction || 'Global',
        relevantLaws: [],
        disclaimer: disclaimerMatch ? 
          disclaimerMatch[1] : 
          'This information is provided for educational purposes only and does not constitute legal advice.'
      };
    }
    
    // Return structured data
    return {
      information: parsedResponse.information || response,
      jurisdiction: jurisdiction || 'Global',
      relevantLaws: parsedResponse.relevantLaws || [],
      disclaimer: parsedResponse.disclaimer || 'This information is provided for educational purposes only and does not constitute legal advice.'
    };
    
  } catch (error) {
    console.error('Error generating legal information:', error);
    throw error;
  }
}
