import { paymentMiddleware } from 'x402-next';

// Configure the payment middleware
// For testing with CDP SDK, we'll use the same address that's signing the requests
export const middleware = paymentMiddleware(
  "0x077645e1A7e0CB971c56bF387e6c83f55a4B2da3", // Using the CDP wallet address
  {
    // Route configurations for protected endpoints
    '/api/summarize': {
      price: '$0.05', // Price in USD
      network: "base-sepolia", // Using testnet for development
      config: {
        description: 'Text summarization service'
      }
    },
    '/api/translate': {
      price: '$0.05',
      network: "base-sepolia",
      config: {
        description: 'Text translation service'
      }
    },
    '/api/generate-image': {
      price: '$0.10',
      network: "base-sepolia",
      config: {
        description: 'AI image generation service'
      }
    },
    '/api/text-generation': {
      price: '$0.05',
      network: "base-sepolia",
      config: {
        description: 'Text generation using Gemini AI'
      }
    },
    '/api/vision-analysis': {
      price: '$0.10',
      network: "base-sepolia",
      config: {
        description: 'Vision analysis using Gemini AI'
      }
    },
    '/api/write': {
      price: '$0.05',
      network: "base-sepolia",
      config: {
        description: 'Content writing service using Gemini AI'
      }
    },
    '/api/code-assistant': {
      price: '$0.07',
      network: "base-sepolia",
      config: {
        description: 'Code assistance service using Gemini AI'
      }
    },
    '/api/research-assistant': {
      price: '$0.08',
      network: "base-sepolia",
      config: {
        description: 'Research assistant service using Gemini AI'
      }
    },
    '/api/poetry-generator': {
      price: '$0.06',
      network: "base-sepolia",
      config: {
        description: 'Poetry generation service using Gemini AI'
      }
    }
  },
  {
    url: "https://x402.org/facilitator" // Facilitator URL for Base Sepolia testnet
  }
);

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/poetry-generator/:path*',
    '/api/summarize/:path*',
    '/api/translate/:path*',
    '/api/generate-image/:path*',
    '/api/text-generation/:path*',
    '/api/vision-analysis/:path*',
    '/api/write/:path*',
    '/api/code-assistant/:path*',
    '/api/research-assistant/:path*',
    '/api/poetry-generator/:path*',
  ]
};
