# FlowForge MVP Backend

This is a [Next.js](https://nextjs.org) project that implements the backend for FlowForge MVP, handling x402 payments, agent orchestration, CDP Wallet, and service registry.

## Features

- **X402 Payment Integration**: Handles cryptocurrency payments for API calls
- **Agent Orchestration**: Executes multi-step agent workflows
- **CDP Wallet Creation**: Creates and manages Coinbase CDP wallets
- **Service Registry**: Maintains a registry of available services

## API Endpoints

### `/api/services`

Returns available registered services.

- **Method**: GET
- **Response**: JSON object containing all registered services

### `/api/summarize`

Summarizes text using Google's Gemini API.

- **Method**: POST
- **Request Body**:
  ```json
  {
    "input": "Long text to summarize..."
  }
  ```
- **Response**: JSON object with the summarized text
- **Payment Required**: $0.05 USDC via x402

### `/api/translate`

Translates text to a specified language using Google's Gemini API.

- **Method**: POST
- **Request Body**:
  ```json
  {
    "text": "Text to translate",
    "targetLanguage": "Spanish"
  }
  ```
- **Response**: JSON object with the translated text
- **Payment Required**: $0.05 USDC via x402

### `/api/generate-image`

Generates an image from a text description using Google's Gemini API.

- **Method**: POST
- **Request Body**:
  ```json
  {
    "prompt": "A detailed description of the image you want to generate"
  }
  ```
- **Response**: JSON object with the generated image as base64 data
- **Payment Required**: $0.10 USDC via x402

### `/api/create-wallet`

Creates a new CDP wallet.

- **Method**: POST
- **Response**: JSON object with wallet address and public key

### `/api/pay-and-call`

Handles X402 payment signing and makes HTTP calls to paid endpoints.

- **Method**: POST
- **Request Body**:
  ```json
  {
    "url": "https://api.example.com/endpoint",
    "method": "GET",
    "data": {},
    "headers": {},
    "privateKey": "your-private-key"
  }
  ```
- **Response**: JSON object with the API response and payment details

### `/api/run-agent`

Accepts agent ID or configuration and executes each step in the workflow.

- **Method**: POST
- **Request Body**:
  ```json
  {
    "agentId": "agent-001",
    "input": "Your input data here",
    "config": {},
    "privateKey": "your-private-key"
  }
  ```
- **Response**: JSON object with the agent execution results

## Getting Started 

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [https://flow-nu-two.vercel.app](https://flow-nu-two.vercel.app) with your browser to see the result.

## Configuration

Before using the API endpoints, make sure to:

1. Update the wallet address in `middleware.ts` to receive payments
2. Set up proper key management for private keys (do not hardcode in production)
3. Configure the facilitator URL based on your environment (testnet/mainnet)
4. Set up the required environment variables in `.env.local`:

```
# For Google Gemini AI Services
GEMINI_API_KEY=your_gemini_api_key_here

# For AkashChat API Services
AKASH_API_KEY=your_akash_api_key_here  # Get this from AkashChat (https://chatapi.akash.network)

# For Coinbase Developer Platform (CDP) Wallet Integration
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret
CDP_FUNDING_WALLET_ID=your_funding_wallet_id  # Optional: For funding new wallets
```

## Testing

The project uses mock data stored in:
- `agents.json`: Contains agent definitions with steps and pricing
- `services.json`: Contains service definitions with endpoints and pricing

For testing purposes, the Base Sepolia testnet facilitator is used.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [X402 Documentation](https://x402.gitbook.io/x402/)
- [Coinbase CDP SDK](https://docs.cloud.coinbase.com/cdp/docs)
