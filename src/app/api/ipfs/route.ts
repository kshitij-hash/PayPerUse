import { NextRequest, NextResponse } from "next/server";
import { Readable } from 'stream';
import pinataSDK from "@pinata/sdk";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Initialize Pinata SDK
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image data provided." }, { status: 400 });
    }

    // Convert base64 to a buffer
    const imageBuffer = Buffer.from(imageBase64.split(';base64,').pop(), 'base64');

    // Create a readable stream from the buffer
    const readableStream = Readable.from(imageBuffer);

    const options = {
      pinataMetadata: {
        name: `Image-${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 0 as const,
      },
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);

    // Save the result to the database
    await prisma.pinataFile.create({
      data: {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: new Date(result.Timestamp),
        name: options.pinataMetadata.name, // Or derive from result if available
        numberOfFiles: 1, // Assuming single file upload
        mimeType: false, // Or determine from file type
        userId: session.user.id,
      },
    });

    console.log(result, "ipfs response")
    return NextResponse.json({ ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}` }, { status: 200 });

  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    return NextResponse.json({ error: "Failed to upload to IPFS." }, { status: 500 });
  }
}
