import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const files = await prisma.pinataFile.findMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching pinata files:", error);
    return NextResponse.json(
      { error: "Failed to fetch pinata files" },
      { status: 500 }
    );
  }
}
