/**
 * Session Wallet Manager
 *
 * Utility functions for managing CDP wallets in user sessions and database
 * Uses a client-side approach with localStorage for browser environments,
 * server-side cookie management for server-side operations,
 * and database storage for persistent wallet data
 */

import db from "@/lib/prisma";

// Constants
const WALLET_LOCAL_STORAGE_KEY = "flowforge_wallet";
export const WALLET_COOKIE_NAME = "flowforge_wallet";

// Use the existing db instance for database operations

/**
 * Session Wallet interface
 */
export interface SessionWallet {
  id: string;
  address: string;
  network: string;
  createdAt: number;
  walletId?: string; // CDP wallet ID
  userId?: string; // User ID for database storage
}

// Client-side localStorage functions
/**
 * Save wallet information to localStorage
 * @param wallet The wallet information to save
 */
export function saveWalletToLocalStorage(wallet: SessionWallet): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(WALLET_LOCAL_STORAGE_KEY, JSON.stringify(wallet));
  }
}

/**
 * Get wallet information from localStorage
 * @returns The wallet information or null if not found
 */
export function getWalletFromLocalStorage(): SessionWallet | null {
  if (typeof window !== "undefined") {
    const walletData = localStorage.getItem(WALLET_LOCAL_STORAGE_KEY);
    if (walletData) {
      try {
        return JSON.parse(walletData) as SessionWallet;
      } catch (error) {
        console.error("Error parsing wallet data from localStorage:", error);
      }
    }
  }
  return null;
}

/**
 * Remove wallet information from localStorage
 */
export function removeWalletFromLocalStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY);
  }
}

/**
 * Check if user has a wallet in local storage (client-side only)
 * @returns True if user has a wallet, false otherwise
 */
export function hasWalletInLocalStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(WALLET_LOCAL_STORAGE_KEY) !== null;
}

/**
 * Helper function to get wallet from session in API routes
 * @param req The request object containing cookies
 * @returns The wallet information or null if not found
 */
export function getWalletFromRequest(req: Request): SessionWallet | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const walletData = cookies[WALLET_COOKIE_NAME];
  if (!walletData) return null;

  try {
    return JSON.parse(walletData) as SessionWallet;
  } catch {
    return null;
  }
}

/**
 * Get the current user session
 * @returns The user session or null if not authenticated
 */
export async function getCurrentUserSession() {
  try {
    const response = await fetch("/api/session");
    const data = await response.json();
    
    if (!data || !data.authenticated) {
      return { authenticated: false };
    }
    
    // Extract the actual session object from the response
    // This ensures we have the correct structure
    return { 
      authenticated: true, 
      session: data.session || data 
    };
  } catch (error) {
    console.error('Error fetching user session:', error);
    return { authenticated: false };
  }
}

/**
 * Get user ID from database using email
 * @param email User email to lookup
 * @returns User ID or null if not found
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const user = await db.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
      },
    });

    return user?.id || null;
  } catch (error) {
    console.error("Error getting user ID from database:", error);
    return null;
  }
}

/**
 * Database functions for wallet management
 */

/**
 * Save wallet to database for a user
 * @param wallet The wallet information to save
 * @param userId The user ID to associate the wallet with
 * @returns The saved wallet or null if failed
 */
export async function saveWalletToDatabase(
  wallet: SessionWallet,
  userId: string
) {
  try {
    const savedWallet = await db.wallet.upsert({
      where: {
        id: wallet.id,
      },
      update: {
        walletId: wallet.walletId || wallet.id,
        address: wallet.address,
        network: wallet.network,
      },
      create: {
        id: wallet.id,
        walletId: wallet.walletId || wallet.id,
        address: wallet.address,
        network: wallet.network,
        userId: userId,
      },
    });

    return savedWallet;
  } catch (error) {
    console.error("Error saving wallet to database:", error);
    return null;
  }
}

/**
 * Get wallet from database for a user
 * @param userId The user ID to get the wallet for
 * @returns The wallet information or null if not found
 */
export async function getWalletFromDatabase(
  userId: string
): Promise<SessionWallet | null> {
  try {
    const wallet = await db.wallet.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!wallet) return null;

    return {
      id: wallet.id,
      walletId: wallet.walletId || wallet.id,
      address: wallet.address || "",
      network: wallet.network || "base-sepolia",
      createdAt: wallet.createdAt.getTime(),
      userId: wallet.userId,
    };
  } catch (error) {
    console.error("Error getting wallet from database:", error);
    return null;
  }
}

/**
 * Remove wallet from database
 * @param walletId The wallet ID to remove
 * @returns True if successful, false otherwise
 */
export async function removeWalletFromDatabase(
  walletId: string
): Promise<boolean> {
  try {
    await db.wallet.delete({
      where: {
        id: walletId,
      },
    });

    return true;
  } catch (error) {
    console.error("Error removing wallet from database:", error);
    return false;
  }
}

/**
 * Get all wallets for a user
 * @param userId The user ID to get wallets for
 * @returns Array of wallet information
 */
export async function getUserWallets(userId: string): Promise<SessionWallet[]> {
  try {
    const wallets = await db.wallet.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return wallets.map((wallet) => ({
      id: wallet.id,
      walletId: wallet.walletId || wallet.id,
      address: wallet.address || "",
      network: wallet.network || "base-sepolia",
      createdAt: wallet.createdAt.getTime(),
      userId: wallet.userId,
    }));
  } catch (error) {
    console.error("Error getting user wallets from database:", error);
    return [];
  }
}

// Client-side functions to interact with server-side session API
/**
 * Save wallet information to server-side session via API
 * @param wallet The wallet information to save
 */
export async function saveWalletToServerSession(
  wallet: SessionWallet
): Promise<boolean> {
  try {
    const response = await fetch("/api/wallet-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "save",
        wallet: wallet,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error saving wallet to server session:", error);
    return false;
  }
}

/**
 * Remove wallet information from server-side session via API
 */
export async function removeWalletFromServerSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/wallet-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error removing wallet from server session:", error);
    return false;
  }
}

/**
 * Get wallet information from server-side session via API
 * @returns The wallet information or null if not found
 */
export async function getWalletFromServerSession(): Promise<SessionWallet | null> {
  try {
    const response = await fetch("/api/wallet-session");
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.wallet) {
      return data.wallet;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting wallet from server session:", error);
    return null;
  }
}
