import { paymentMiddleware } from "x402-next";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Define baseMiddleware with paid API routes
const baseMiddleware = paymentMiddleware(
  "0x077645e1A7e0CB971c56bF387e6c83f55a4B2da3",
  {
    "/api/summarize": {
      price: "$0.05",
      network: "base-sepolia",
      config: { description: "Text summarization service" },
    },
    "/api/translate": {
      price: "$0.05",
      network: "base-sepolia",
      config: { description: "Text translation service" },
    },
    "/api/generate-image": {
      price: "$0.10",
      network: "base-sepolia",
      config: { description: "AI image generation service" },
    },
    "/api/text-generation": {
      price: "$0.05",
      network: "base-sepolia",
      config: { description: "Text generation using Gemini AI" },
    },
    "/api/vision-analysis": {
      price: "$0.10",
      network: "base-sepolia",
      config: { description: "Vision analysis using Gemini AI" },
    },
    "/api/write": {
      price: "$0.05",
      network: "base-sepolia",
      config: { description: "Content writing service using Gemini AI" },
    },
    "/api/code-assistant": {
      price: "$0.07",
      network: "base-sepolia",
      config: { description: "Code assistance service using Gemini AI" },
    },
    "/api/research-assistant": {
      price: "$0.08",
      network: "base-sepolia",
      config: { description: "Research assistant service using Gemini AI" },
    },
    "/api/poetry-generator": {
      price: "$0.06",
      network: "base-sepolia",
      config: { description: "Poetry generation service using Gemini AI" },
    },
    "/api/akash-chat": {
      price: "$0.05",
      network: "base-sepolia",
      config: { description: "Chat with various open-source AI models powered by the Akash Supercloud" },
    },
  },
  {
    url: "https://x402.org/facilitator",
  }
);

const PUBLIC_ROUTES = ["/", "/sign-in"];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;
  console.log("Session:", session);

  // Redirect unauthenticated users
  if (!session) {
    const loginUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Pass through to payment middleware
  return baseMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // "/((?!_next/static|_next/image|favicon.ico).*)",
    // "/api/(summarize|translate|generate-image|text-generation|vision-analysis|write|code-assistant|research-assistant|poetry-generator|akash-chat)(/.*)?",
  ],
};
