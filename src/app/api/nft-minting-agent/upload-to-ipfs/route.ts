import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import pinataSDK from "@pinata/sdk";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Initialize Pinata SDK
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

// Type for collection details from request body
type CollectionDetails = {
  collectionName: string;
  nftName: string;
  description?: string;
};

/**
 * POST handler for /api/nft-minting-agent/upload-to-ipfs
 * Step 2 of NFT generation process: Upload generated image to IPFS
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { imageBase64, collectionDetails }: { imageBase64: string, collectionDetails: CollectionDetails } = await req.json();

    if (!imageBase64 || !imageBase64.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Valid image data is required" },
        { status: 400 }
      );
    }

    if (!collectionDetails || !collectionDetails.collectionName || !collectionDetails.nftName) {
      return NextResponse.json(
        { error: "Collection details are required" },
        { status: 400 }
      );
    }

    // Extract base64 data without the prefix
    const base64Data = imageBase64.split(",")[1];
    
    // Convert base64 to a buffer
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Create a readable stream from the buffer
    const readableStream = Readable.from(imageBuffer);

    // Prepare options for Pinata
    const imageOptions = {
      pinataMetadata: {
        name: `${collectionDetails.collectionName}-${collectionDetails.nftName}`,
      },
      pinataOptions: {
        cidVersion: 0 as 0 | 1 | undefined,
      },
    };

    // Attempt to authenticate the user
    const session = await auth();
    const userId = session?.user?.id || "anonymous-user";

    console.log(
      `IPFS upload request - Auth: ${
        session ? "authenticated" : "unauthenticated"
      }, User: ${userId}`
    );

    // Upload image to IPFS
    const imageResult = await pinata.pinFileToIPFS(
      readableStream,
      imageOptions
    );
    const imageUri = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`;

    // Save the image result to the database if user is authenticated
    if (session?.user?.id) {
      await prisma.pinataFile.create({
        data: {
          ipfsHash: imageResult.IpfsHash,
          pinSize: imageResult.PinSize,
          timestamp: new Date(imageResult.Timestamp),
          name: imageOptions.pinataMetadata.name,
          numberOfFiles: 1,
          mimeType: false, // Image file
          userId: session.user.id,
        },
      });
    } else {
      console.log(
        `Skipping database save for unauthenticated user - Image hash: ${imageResult.IpfsHash}`
      );
    }

    // Return the IPFS information
    return NextResponse.json(
      {
        imageUri,
        imageIpfsHash: imageResult.IpfsHash,
        collectionDetails,
        step: 2,
        nextStep: "create-metadata",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
