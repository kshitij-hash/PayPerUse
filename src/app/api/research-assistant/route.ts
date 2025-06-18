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
 * Research Assistant API
 * Generates research materials based on a topic including outline, questions, subtopics, etc.
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
              resource: "http://localhost:3000/api/research-assistant",
              description: "Research Assistant service",
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
    const { topic, depth = "standard", focus = "general", format = "academic" } = await req.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate research materials
    const researchMaterials = await generateResearchMaterials(topic, depth, focus, format);
    
    return NextResponse.json(researchMaterials);
  } catch (error: unknown) {
    console.error('Error in research assistant service:', error);
    
    // Check for rate limit errors from Gemini API
    const errorObj = error as { message?: string; status?: number; response?: { status?: number } };
    if (errorObj?.message?.includes('429 Too Many Requests') || 
        errorObj?.status === 429 || 
        errorObj?.response?.status === 429) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please try again later.', 
          details: 'The Gemini API quota has been exceeded for all available models.'
        },
        { status: 429 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Failed to generate research materials', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate research materials using Gemini API
 */
async function generateResearchMaterials(
  topic: string, 
  depth: string = "standard", 
  focus: string = "general",
  format: string = "academic"
): Promise<{
  outline: string;
  keyQuestions: string[];
  subtopics: string[];
  introduction: string;
  conclusion: string;
  keywords: string[];
  references: string[];
  methodologySuggestions: string;
}> {
  // Define the depth levels
  const depthLevels = {
    "basic": "a basic overview with main points only",
    "standard": "a standard depth research with moderate detail",
    "comprehensive": "a comprehensive in-depth research with extensive detail"
  };
  
  // Define focus areas
  const focusAreas = {
    "general": "general overview of the topic",
    "historical": "historical development and background",
    "contemporary": "current developments and modern perspectives",
    "analytical": "critical analysis and evaluation",
    "comparative": "comparison with related topics or approaches",
    "practical": "practical applications and real-world implications"
  };
  
  // Define format styles
  const formatStyles = {
    "academic": "formal academic style with proper citations",
    "business": "business report style with executive summary",
    "educational": "educational material style with learning objectives",
    "journalistic": "journalistic style with engaging narrative"
  };
  
  // Create the base prompt for research outline
  const outlinePrompt = `You are an expert research assistant. Generate a detailed research outline for the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}
Format style: ${formatStyles[format as keyof typeof formatStyles] || formatStyles.academic}

Provide a structured outline with main sections and subsections. Include logical progression of ideas from introduction to conclusion.`;

  // Create prompt for key research questions
  const questionsPrompt = `You are an expert research assistant. Generate 5-7 key research questions for investigating the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}

The questions should be thought-provoking, specific, and help guide a comprehensive investigation of the topic. Format the questions as a JSON array.`;

  // Create prompt for subtopics
  const subtopicsPrompt = `You are an expert research assistant. Identify 5-8 important subtopics or related areas for the main research topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}

These subtopics should cover different aspects of the main topic and help create a comprehensive research paper. Format the subtopics as a JSON array.`;

  // Create prompt for introduction
  const introductionPrompt = `You are an expert research assistant. Write an engaging introduction paragraph for a research paper on the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}
Format style: ${formatStyles[format as keyof typeof formatStyles] || formatStyles.academic}

The introduction should provide context, state the importance of the topic, and briefly outline the scope of the research.`;

  // Create prompt for conclusion
  const conclusionPrompt = `You are an expert research assistant. Write a concluding paragraph for a research paper on the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}
Format style: ${formatStyles[format as keyof typeof formatStyles] || formatStyles.academic}

The conclusion should summarize the main points, restate the significance of the topic, and suggest implications or future research directions.`;

  // Create prompt for keywords
  const keywordsPrompt = `You are an expert research assistant. Generate 10-15 relevant keywords or search terms for researching the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}

These keywords should be useful for database searches, literature reviews, and finding relevant sources. Format the keywords as a JSON array.`;

  // Create prompt for references
  const referencesPrompt = `You are an expert research assistant. Suggest 5-8 potential academic sources or references that would be valuable for researching the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}
Format style: ${formatStyles[format as keyof typeof formatStyles] || formatStyles.academic}

Include a mix of books, journal articles, and other credible sources. Format the references in a proper citation style as a JSON array.`;

  // Create prompt for methodology suggestions
  const methodologyPrompt = `You are an expert research assistant. Suggest appropriate research methodologies for investigating the topic: "${topic}".
  
Research depth: ${depthLevels[depth as keyof typeof depthLevels] || depthLevels.standard}
Focus area: ${focusAreas[focus as keyof typeof focusAreas] || focusAreas.general}
Format style: ${formatStyles[format as keyof typeof formatStyles] || formatStyles.academic}

Explain which research methods (qualitative, quantitative, mixed methods, etc.) would be most appropriate and why. Include data collection and analysis techniques.`;

  // Try each model with exponential backoff for each prompt
  let outline = '';
  let keyQuestions: string[] = [];
  let subtopics: string[] = [];
  let introduction = '';
  let conclusion = '';
  let keywords: string[] = [];
  let references: string[] = [];
  let methodologySuggestions = '';

  // Helper function to generate content with retry logic
  async function generateWithRetry(prompt: string, isJson: boolean = false): Promise<string> {
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
          
          const responseText = response.text || '';
          
          // If expecting JSON, try to parse and extract array
          if (isJson) {
            try {
              // Try to extract JSON array from the response
              const jsonMatch = responseText.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                return jsonMatch[0];
              }
              // If no JSON array found, return the whole response
              return responseText;
            } catch (e) {
              console.log('Failed to parse JSON response, returning raw text');
              return responseText;
            }
          }
          
          return responseText;
        } catch (error: unknown) {
          const errorObj = error as { message?: string; status?: number; response?: { status?: number } };
          
          if (errorObj?.message?.includes('429 Too Many Requests') || 
              errorObj?.status === 429 || 
              errorObj?.response?.status === 429) {
            
            let extractedDelay = 0;
            if (typeof errorObj.message === 'string') {
              const retryMatch = errorObj.message.match(/"retryDelay":"(\d+)s"/i);
              if (retryMatch && retryMatch[1]) {
                extractedDelay = parseInt(retryMatch[1]) * 1000;
              }
            }
            
            const waitTime = extractedDelay || retryDelay;
            console.log(`Rate limit hit for ${modelName}. Retrying in ${waitTime/1000} seconds...`);
            
            await sleep(waitTime);
            retryDelay *= 2;
            retryCount++;
          } else {
            console.log(`Error with model ${modelName}, trying next model:`, error);
            break;
          }
        }
      }
    }
    
    throw new Error('All models failed to generate content');
  }

  // Generate all research materials
  try {
    // Generate in parallel to improve performance
    [outline, introduction, conclusion, methodologySuggestions] = await Promise.all([
      generateWithRetry(outlinePrompt),
      generateWithRetry(introductionPrompt),
      generateWithRetry(conclusionPrompt),
      generateWithRetry(methodologyPrompt)
    ]);

    // Parse JSON responses
    const [keyQuestionsJson, subtopicsJson, keywordsJson, referencesJson] = await Promise.all([
      generateWithRetry(questionsPrompt, true),
      generateWithRetry(subtopicsPrompt, true),
      generateWithRetry(keywordsPrompt, true),
      generateWithRetry(referencesPrompt, true)
    ]);

    // Parse JSON responses safely
    try {
      keyQuestions = JSON.parse(keyQuestionsJson);
    } catch (e) {
      keyQuestions = [keyQuestionsJson];
    }

    try {
      subtopics = JSON.parse(subtopicsJson);
    } catch (e) {
      subtopics = [subtopicsJson];
    }

    try {
      keywords = JSON.parse(keywordsJson);
    } catch (e) {
      keywords = [keywordsJson];
    }

    try {
      references = JSON.parse(referencesJson);
    } catch (e) {
      references = [referencesJson];
    }
  } catch (error) {
    console.error('Error generating research materials:', error);
    throw error;
  }

  return {
    outline,
    keyQuestions,
    subtopics,
    introduction,
    conclusion,
    keywords,
    references,
    methodologySuggestions
  };
}
