// TODO: This route is getting hit for storing images in pinata 

import { NextResponse } from 'next/server';
import { uploadWithCdp } from '../../../pinata/upload';

export async function POST(request: Request) {
  try {
    const { imageUrl, walletId } = await request.json();

    if (!imageUrl || !walletId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or walletId' },
        { status: 400 },
      );
    }

    // The imageUrl might be a JSON string from another service, attempt to parse it.
    let actualImageUrl = imageUrl;
    try {
      const parsed = JSON.parse(imageUrl);
      if (parsed && typeof parsed.result === 'string') {
        actualImageUrl = parsed.result;
      }
    } catch {
      // Not a JSON string, assume it's a valid URL
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(actualImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL' },
        { status: 500 },
      );
    }
    const imageBlob = await imageResponse.blob();

    // Upload the image to Pinata
    const ipfsHash = await uploadWithCdp(walletId, imageBlob, 'image');

    return NextResponse.json({ ipfsHash });
  } catch (error) {
    console.error('Error storing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
