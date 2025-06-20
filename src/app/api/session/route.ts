// app/api/session/route.ts (App Router)
// or pages/api/session.ts (Pages Router)

import { auth } from "@/lib/auth"; // adjust path if needed
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, session });
}
