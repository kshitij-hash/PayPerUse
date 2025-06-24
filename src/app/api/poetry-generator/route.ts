import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Define models in order of preference
const MODELS = [
  "gemini-2.5-flash",  // Primary model (newest and fastest)
  "gemini-1.5-pro",    // Fallback model 1
  "gemini-1.0-pro"     // Fallback model 2
];

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Poetry Generator API
 * Generates poetry based on a topic, style, and mood
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
              resource: "https://flow-nu-two.vercel.app/api/poetry-generator",
              description: "Poetry Generator service",
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
    const { topic, style, mood } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate poetry
    const result = await generatePoetry(topic, style, mood);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating poetry:', error);
    return NextResponse.json(
      { error: 'Failed to generate poetry', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate poetry using Gemini API
 */
async function generatePoetry(
  topic: string,
  style: string = "free verse",
  mood: string = "reflective"
): Promise<{
  poem: string;
  title: string;
  style: string;
  analysis: string;
}> {
  // Define poetry styles
  const poetryStyles = {
    "haiku": "a traditional Japanese poem consisting of three short lines that do not rhyme, with 5, 7, and 5 syllables respectively",
    "sonnet": "a 14-line poem with a specific rhyme scheme, traditionally about love",
    "free verse": "poetry that does not follow specific formulas of rhyme, meter, or other musical pattern",
    "limerick": "a humorous five-line poem with an AABBA rhyme scheme",
    "acrostic": "a poem where the first letter of each line spells out a word or message",
    "ballad": "a narrative poem that tells a story, often with repeated refrains",
    "villanelle": "a 19-line poem with two repeating rhymes and two refrains",
    "tanka": "a Japanese poem similar to haiku but with two additional lines of 7 syllables each",
    "epic": "a lengthy narrative poem celebrating adventures and accomplishments of a hero",
    "ode": "a lyrical poem that addresses and celebrates a person, place, thing, or idea"
  };

  // Define moods
  const poetryMoods = {
    "joyful": "expressing happiness, delight, and celebration",
    "melancholic": "expressing sadness, grief, or a sense of loss",
    "reflective": "thoughtful, contemplative, and introspective",
    "romantic": "expressing love, passion, and deep emotion",
    "mysterious": "creating a sense of wonder, enigma, and the unknown",
    "angry": "expressing rage, frustration, or righteous indignation",
    "peaceful": "calm, serene, and tranquil",
    "nostalgic": "evoking fond memories and a longing for the past",
    "hopeful": "optimistic and looking forward to the future",
    "dramatic": "intense, theatrical, and emotionally charged"
  };

  // Get style and mood descriptions
  const styleDescription = poetryStyles[style as keyof typeof poetryStyles] || poetryStyles["free verse"];
  const moodDescription = poetryMoods[mood as keyof typeof poetryMoods] || poetryMoods["reflective"];

  // Create the prompt for poetry generation
  const poetryPrompt = `You are an expert poet. Create a beautiful ${style} poem about "${topic}" with a ${mood} mood.

Style description: ${styleDescription}
Mood description: ${moodDescription}

Please format your response as follows:
1. First, provide a fitting title for the poem.
2. Then, write the poem itself, following the conventions of the ${style} style.
3. Finally, provide a brief analysis of the poetic elements used (metaphors, imagery, etc.) in 2-3 sentences.

Ensure the poem is original, evocative, and captures the essence of the topic while maintaining the requested style and mood.`;

  // Try each model with exponential backoff
  let poem = '';
  let title = '';
  let analysis = '';

  // Helper function to generate content with retry logic
  async function generateWithRetry(prompt: string): Promise<string> {
    for (const modelName of MODELS) {
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Trying model ${modelName} for prompt, attempt ${retryCount + 1}`);
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
    
    throw new Error('All models failed to generate content');
  }

  try {
    const response = await generateWithRetry(poetryPrompt);
    
    // Parse the response to extract title, poem, and analysis
    const titleMatch = response.match(/^(.+?)(?:\n|$)/);
    title = titleMatch ? titleMatch[1].replace(/^["']|["']$/g, '').trim() : 'Untitled';
    
    // Extract the poem (everything between the title and the analysis)
    const analysisIndex = response.toLowerCase().indexOf('analysis');
    if (analysisIndex > 0) {
      poem = response.substring(title.length, analysisIndex).trim();
      analysis = response.substring(analysisIndex).trim();
    } else {
      // If no analysis section is found, assume everything after the title is the poem
      poem = response.substring(title.length).trim();
      analysis = '';
    }
    
    // Clean up the poem (remove any "Poem:" prefix if present)
    poem = poem.replace(/^(?:poem:|the poem:)/i, '').trim();
    
  } catch (error) {
    console.error('Error generating poetry:', error);
    throw error;
  }

  return {
    poem,
    title,
    style,
    analysis
  };
}
