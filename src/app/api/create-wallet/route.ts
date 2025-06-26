import { NextResponse } from "next/server";
import { CdpClient } from "@coinbase/cdp-sdk";
import {
  WALLET_COOKIE_NAME,
  saveWalletToDatabase,
  SessionWallet,
} from "@/lib/sessionWalletManager";
// This API will save wallet data to a secure HTTP-only cookie and also return the data
// for the client to optionally store in localStorage for faster access

/**
 * POST handler for /api/create-wallet
 * Creates a new CDP wallet and optionally funds it
 *
 * Request body can include:
 * - fund: Boolean to indicate if the wallet should be funded (default: true)
 * - amount: Amount to fund in ETH (default: "0.01")
 *
 * Environment variables required:
 * - CDP_API_KEY_ID: Coinbase Developer Platform API Key ID
 * - CDP_API_KEY_SECRET: Coinbase Developer Platform API Key Secret
 * - CDP_WALLET_SECRET: (Optional) CDP Wallet Secret for write operations
 * - CDP_FUNDING_WALLET_ID: (Optional) Wallet ID to use for funding new wallets
 */
export async function POST() {
  try {
    // Check for required environment variables
    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
      return NextResponse.json(
        { error: "Missing required CDP API credentials" },
        { status: 400 }
      );
    }

    // Initialize the CDP client with provided credentials
    const cdp = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });

    // Create a new account
    const account = await cdp.evm.createAccount({
      name: `wallet-${Date.now()}`,
    });
    console.log(`Created new wallet with address: ${account.address}`);

    interface ExtendedAccount {
      address: string;
      id?: string;
      network?: string;
    }

    // Cast account to our extended type
    const extendedAccount = account as ExtendedAccount;

    // Get current user session directly from Auth.js
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    // Get user ID - either directly from session or by looking up via email
    let userId = session?.user?.id;

    // If no user ID but we have an email, try to look up the user ID
    if (!userId && session?.user?.email) {
      const { getUserIdByEmail } = await import("@/lib/sessionWalletManager");
      try {
        const foundUserId = await getUserIdByEmail(session.user.email);
        if (foundUserId) {
          userId = foundUserId; // Only assign if not null
          console.log(
            `Found user ID ${userId} for email ${session.user.email}`
          );
        } else {
          console.warn(`No user ID found for email ${session.user.email}`);
        }
      } catch (error) {
        console.error("Error looking up user ID by email:", error);
      }
    }

    // Prepare wallet information
    const walletInfo: SessionWallet = {
      id: extendedAccount.id || `wallet-${Date.now()}`, // Fallback ID if not provided by SDK
      address: extendedAccount.address,
      network: extendedAccount.network || "base-sepolia", // Default to base-sepolia for x402 testing
      createdAt: Date.now(),
      walletId: extendedAccount.id || undefined,
      userId: userId || undefined,
    };

    // If user is authenticated, save wallet to database
    let dbSaveResult = null;
    if (userId) {
      dbSaveResult = await saveWalletToDatabase(walletInfo, userId);
    }

    // Save wallet data to a secure HTTP-only cookie
    // Calculate expiry date (30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Create response with wallet information
    const response = NextResponse.json(
      {
        success: true,
        wallet: walletInfo,
        sessionSaved: true,
        dbSaved: !!dbSaveResult,
      },
      { status: 200 }
    );

    // Set wallet data in a secure HTTP-only cookie
    response.cookies.set({
      name: WALLET_COOKIE_NAME,
      value: JSON.stringify(walletInfo),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiryDate,
    });

    // Return the response with cookie
    return response;
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      {
        error: "Failed to create wallet",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
