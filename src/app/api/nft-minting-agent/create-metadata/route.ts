import { NextRequest, NextResponse } from "next/server";
import pinataSDK from "@pinata/sdk";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Initialize Pinata SDK
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collection?: {
    name: string;
    family?: string;
  };
}

/**
 * POST handler for /api/nft-minting-agent/create-metadata
 * Step 3 of NFT generation process: Create and upload NFT metadata to IPFS
 */
export async function POST(req: NextRequest) {
  try {
    // Attempt to authenticate the user
    const session = await auth();
    const userId = session?.user?.id || "anonymous-user";

    console.log(
      `Metadata creation request - Auth: ${
        session ? "authenticated" : "unauthenticated"
      }, User: ${userId}`
    );

    // For unauthenticated requests (e.g., via proxy)
    if (!session?.user?.id) {
      console.log("Processing unauthenticated metadata creation request via proxy");
    }

    const body = await req.json();
    const { imageUri, collectionDetails } = body;

    if (!imageUri) {
      return NextResponse.json({ error: "No image URI provided." }, { status: 400 });
    }

    if (!collectionDetails || !collectionDetails.collectionName || !collectionDetails.nftName) {
      return NextResponse.json({ error: "Collection details are required." }, { status: 400 });
    }

    // Create ERC721-compliant metadata
    const metadata: NFTMetadata = {
      name: collectionDetails.nftName,
      description: collectionDetails.description || `NFT from collection: ${collectionDetails.collectionName}`,
      image: imageUri,
      attributes: [
        {
          trait_type: "Collection",
          value: collectionDetails.collectionName
        },
        {
          trait_type: "Created",
          value: new Date().toISOString().split('T')[0] // YYYY-MM-DD
        }
      ],
      collection: {
        name: collectionDetails.collectionName
      }
    };

    // Upload metadata to Pinata
    const options = {
      pinataMetadata: {
        name: `${collectionDetails.collectionName}-${collectionDetails.nftName}-metadata`,
      },
      pinataOptions: {
        cidVersion: 0 as const,
      },
    };

    const result = await pinata.pinJSONToIPFS(metadata, options);

    // Save the metadata result to the database if user is authenticated
    if (session?.user?.id) {
      await prisma.pinataFile.create({
        data: {
          ipfsHash: result.IpfsHash,
          pinSize: result.PinSize,
          timestamp: new Date(result.Timestamp),
          name: options.pinataMetadata.name,
          numberOfFiles: 1,
          mimeType: true, // JSON file
          userId: session.user.id,
        },
      });
    } else {
      console.log(
        `Skipping database save for unauthenticated user - Metadata hash: ${result.IpfsHash}`
      );
    }

    // Return the metadata URI
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    return NextResponse.json({ 
      metadataUri,
      metadataIpfsHash: result.IpfsHash,
      collectionDetails,
      step: 3,
      nextStep: "complete"
    }, { status: 200 });

  } catch (error) {
    console.error("Error creating NFT metadata:", error);
    return NextResponse.json({ error: "Failed to create NFT metadata." }, { status: 500 });
  }
}
