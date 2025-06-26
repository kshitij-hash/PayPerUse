import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { auth } from "@/lib/auth";

// Initialize AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface NFTCollectionDetails {
  collectionName: string;
  nftName: string;
  description?: string;
  ticker?: string;
}

/**
 * POST handler for /api/nft-minting-agent/generate-image
 * Step 1 of NFT generation process: Generate image using Stability AI on AWS Bedrock
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { prompt, collectionName, nftName, description, ticker } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Image prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate collection details
    if (!collectionName || !nftName) {
      return NextResponse.json(
        { error: "Collection name and NFT name are required" },
        { status: 400 }
      );
    }

    // Create collection details object
    const collectionDetails: NFTCollectionDetails = {
      collectionName,
      nftName,
      description: description || "",
      ticker: ticker || "",
    };

    // Configure Stability AI request parameters
    const stabilityAIParams = {
      text_prompts: [
        {
          text: prompt,
          weight: 1.0,
        },
      ],
      cfg_scale: 7,
      steps: 30,
      width: 1024,
      height: 1024,
      seed: Math.floor(Math.random() * 4294967295), // Random seed
      style_preset: "digital-art",
    };

    // Create the Bedrock model invocation command
    const command = new InvokeModelCommand({
      modelId: "stability.stable-diffusion-xl-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(stabilityAIParams),
    });

    // Invoke the Stability AI model on Bedrock
    const response = await bedrockClient.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.artifacts || responseBody.artifacts.length === 0) {
      throw new Error("No image was generated");
    }

    // Get the base64 image data from the response
    const base64Image = responseBody.artifacts[0].base64;
    const base64ImageWithPrefix = `data:image/png;base64,${base64Image}`;

    // Log the successful generation
    console.log(
      `Generated NFT image for collection: ${collectionDetails.collectionName}, NFT: ${collectionDetails.nftName}`
    );

    // Attempt to authenticate the user
    const session = await auth();
    // Get user ID or use a default for unauthenticated requests
    // This allows the x402-proxy to work without authentication
    const userId = session?.user?.id || "anonymous-user";

    console.log(
      `NFT generation request - Auth: ${
        session ? "authenticated" : "unauthenticated"
      }, User: ${userId}`
    );

    // For logging purposes only
    if (!session?.user?.id) {
      console.log(
        "Processing unauthenticated NFT generation request via proxy"
      );
    }

    // Return just the generated image and collection details
    // The client will need to call the upload-to-ipfs endpoint next
    return NextResponse.json(
      {
        result: base64ImageWithPrefix,
        collectionDetails,
        step: 1,
        nextStep: "upload-to-ipfs",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in NFT image generation:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
