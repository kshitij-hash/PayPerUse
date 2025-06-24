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
      config: {
        description:
          "Chat with various open-source AI models powered by the Akash Supercloud",
      },
    },
    "/api/legal-assistant": {
      price: "$0.10",
      network: "base-sepolia",
      config: { description: "Legal assistant service using Gemini AI" },
    },
  },
  {
    url: "https://x402.org/facilitator",
  }
);

const PUBLIC_ROUTES = ["/", "/sign-in", "/api/auth/callback/google", "/services", "/api/services"];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Check if this is a paid API route
  const paidApiRoutes = [
    "/api/summarize",
    "/api/translate",
    "/api/generate-image",
    "/api/text-generation",
    "/api/vision-analysis",
    "/api/write",
    "/api/code-assistant",
    "/api/research-assistant",
    "/api/poetry-generator",
    "/api/akash-chat",
    "/api/legal-assistant"
  ];

  const isPaidApiRoute = paidApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // For paid API routes, bypass auth check and go straight to payment middleware
  if (isPaidApiRoute) {
    console.log(`Bypassing auth check for paid API route: ${pathname}`);
    return baseMiddleware(req);
  }

  // Allow public routes and auth-related routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get session from auth
  const session = req.auth;

  // Add debug info but don't log the entire session object
  console.log(
    `Middleware: Path ${pathname}, Auth ${session ? "exists" : "null"}`
  );

  // Redirect unauthenticated users
  if (!session) {
    console.log(
      `Redirecting unauthenticated user from ${pathname} to /sign-in`
    );
    const loginUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Pass through to regular routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
    "/api/(summarize|translate|generate-image|text-generation|vision-analysis|write|code-assistant|research-assistant|poetry-generator|akash-chat)(/.*)?",
  ],
};
