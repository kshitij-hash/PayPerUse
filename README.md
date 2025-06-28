# PayPerUse: Composable AI Agent Marketplace

**PayPerUse** is a decentralized, pay-per-use AI agent marketplace that empowers developers to build and monetize intelligent microservices, and allows users to access powerful, composable AI agents on demand. The platform leverages Web3-native technologies like **x402** and **CDP Wallets** to enable frictionless monetization, while integrating **Amazon Bedrock**, **Akash Network**, and **Pinata** for powerful compute and storage capabilities.

---

## Details

PayPerUse solves major pain points in modern AI tooling:

- Subscription-heavy models that lock users into platforms  
- Lack of fair monetization for AI service contributors  
- Fragmented tools without modular, reusable flows  

PayPerUse introduces an open, composable ecosystem where:

- Every agent is modular and monetized per use via **x402**  
- Users pay only for what they use via **CDP Wallets**  
- Developers instantly earn with on-chain revenue sharing  
- Services are powered by decentralized compute and storage  

---

## Features

### 1. Modular AI Agents

Each agent is a self-contained microservice with defined inputs/outputs. Agents can be standalone or composed into workflows (e.g., summarizer → translator → formatter). All are wrapped behind **x402** paywalls.

**Users can:**

- Run agents directly via chat UI or API  
- View agent descriptions, input requirements, and cost  
- Fund their wallets and pay per use  

**Developers can:**

- Register new agents and set pricing  
- Receive revenue automatically via **CDP Wallet** split logic  
- List custom workflows on the marketplace  

---

### 2. NFT Minting Workflow (Agentic Automation)

A dedicated NFT Minting agent handles the entire minting process:

1. Accepts user input (image description, collection name, etc.)  
2. Image is generated via Bedrock model (e.g., Titan)  
3. Image is uploaded to IPFS via **Pinata**  
4. Metadata is compiled and pinned to IPFS  
5. NFT is minted on **Base** and sent to user’s wallet  

Each step is handled by a dedicated agent, orchestrated automatically and paid via **x402 + CDP Wallet**.

---

### 3. Akash Chat Integration

- Akash Chat is built-in to assist users with selecting agents and refining inputs to maximize the value of each paid interaction  
- A standalone **Akash Chat Agent** is available for free, powered by decentralized LLMs like **Meta LLaMA**, **DeepSeek**, and **Qwen**  
- Ensures low-cost, censorship-resistant access to intelligent assistants  

---

### 4. Pinata-Powered Storage

- All agent-generated content (images, metadata, documents) is stored on **IPFS via Pinata**  
- Users can choose between public or private uploads  
- Upload to IPFS directly via the **Image Generation agent’s interface**  
- IPFS assets are easily accessible and verifiable on user profiles  

---

### 5. Agent Builder & Marketplace

- Users can compose custom workflows using existing agents  
- Publish agentic flows to the public marketplace  
- Set pricing and monetization logic (splits, referrals, commissions)  
- Full control over access and revenue generation  

---

## Technology Stack

- **Frontend:** Next.js, TailwindCSS  
- **Backend:** Node.js, Express, x402 Facilitator, Coinbase CDP Wallet SDK  
- **Storage:** Pinata + IPFS  
- **Compute:** Akash Network (Akash Chat + LLMs)  
- **AI:** Amazon Bedrock (Claude, Mistral, Titan, etc.)  
- **Blockchain:** Base (for USDC transactions and NFT minting)  
