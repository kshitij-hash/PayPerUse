/**
 * Session Wallet Manager
 * 
 * Utility functions for managing CDP wallets in user sessions
 * Uses a client-side approach with localStorage for browser environments
 * and server-side cookie management for server-side operations
 */

// Constants
const WALLET_LOCAL_STORAGE_KEY = 'flowforge_wallet';
export const WALLET_COOKIE_NAME = 'flowforge_wallet';

/**
 * Session Wallet interface
 */
export interface SessionWallet {
  id: string;
  address: string;
  network: string;
  createdAt: number;
}

// Client-side localStorage functions
/**
 * Save wallet information to localStorage
 * @param wallet The wallet information to save
 */
export function saveWalletToLocalStorage(wallet: SessionWallet): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_LOCAL_STORAGE_KEY, JSON.stringify(wallet));
  }
}

/**
 * Get wallet information from localStorage
 * @returns The wallet information or null if not found
 */
export function getWalletFromLocalStorage(): SessionWallet | null {
  if (typeof window !== 'undefined') {
    const walletData = localStorage.getItem(WALLET_LOCAL_STORAGE_KEY);
    if (walletData) {
      try {
        return JSON.parse(walletData) as SessionWallet;
      } catch (error) {
        console.error('Error parsing wallet data from localStorage:', error);
      }
    }
  }
  return null;
}

/**
 * Remove wallet information from localStorage
 */
export function removeWalletFromLocalStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WALLET_LOCAL_STORAGE_KEY);
  }
}

/**
 * Check if user has a wallet in local storage (client-side only)
 * @returns True if user has a wallet, false otherwise
 */
export function hasWalletInLocalStorage(): boolean {
  if (typeof window === 'undefined') {
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
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
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

// Client-side functions to interact with server-side session API
/**
 * Save wallet information to server-side session via API
 * @param wallet The wallet information to save
 */
export async function saveWalletToServerSession(wallet: SessionWallet): Promise<boolean> {
  try {
    const response = await fetch('/api/wallet-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save',
        wallet: wallet
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving wallet to server session:', error);
    return false;
  }
}

/**
 * Remove wallet information from server-side session via API
 */
export async function removeWalletFromServerSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/wallet-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete'
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error removing wallet from server session:', error);
    return false;
  }
}

/**
 * Get wallet information from server-side session via API
 * @returns The wallet information or null if not found
 */
export async function getWalletFromServerSession(): Promise<SessionWallet | null> {
  try {
    const response = await fetch('/api/wallet-session');
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.wallet || null;
  } catch (error) {
    console.error('Error getting wallet from server session:', error);
    return null;
  }
}
