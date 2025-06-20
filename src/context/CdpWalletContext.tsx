"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  saveWalletToLocalStorage,
  getWalletFromLocalStorage,
  removeWalletFromLocalStorage,
  getCurrentUserSession,
  saveWalletToServerSession,
  removeWalletFromServerSession,
  getWalletFromServerSession,
  getUserIdByEmail,
  SessionWallet,
} from "@/lib/sessionWalletManager";
import { callPaidApi } from "@/lib/x402Client";

// Define token balance interface
export interface TokenBalance {
  token: {
    address: string;
    name?: string;
    symbol?: string;
    decimals?: number;
  };
  amount: string | {
    amount: string;
    decimals: number;
  };
  usdValue?: string;
}

// Define the context type
interface CdpWalletContextType {
  wallet: SessionWallet | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  tokenBalances: TokenBalance[];
  isLoadingBalances: boolean;
  createWallet: (fund?: boolean) => Promise<void>;
  clearWallet: () => Promise<void>;
  fetchTokenBalances: (walletData?: SessionWallet) => Promise<void>;
  callPaidApiWithWallet: <T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: Record<string, unknown>
  ) => Promise<T>;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

// Create the context with default values
const CdpWalletContext = createContext<CdpWalletContextType>({
  wallet: null,
  isLoading: false,
  error: null,
  successMessage: null,
  tokenBalances: [],
  isLoadingBalances: false,
  createWallet: async () => {},
  clearWallet: async () => {},
  fetchTokenBalances: async () => {},
  callPaidApiWithWallet: async () => {
    throw new Error("Not implemented");
  },
  setError: () => {},
  setSuccessMessage: () => {},
});

// Provider component
export function CdpWalletProvider({ children }: { children: ReactNode }) {
  // Get user session from next-auth
  // Define a proper type for the session object
  interface UserSession {
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }
  
  const [session, setSession] = useState<UserSession | null>(null);
  
  // Fetch session data when component mounts
  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getCurrentUserSession();
        setSession(sessionData.session);
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    }
    
    fetchSession();
  }, []);
  
  // State for wallet information
  const [wallet, setWallet] = useState<SessionWallet | null>(null);
  // State for loading status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for error messages
  const [error, setError] = useState<string | null>(null);
  // State for success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // State for token balances
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  // State for balance loading
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);

  /**
   * Fetch token balances for a wallet
   */
  const fetchTokenBalances = useCallback(async (walletData: SessionWallet | undefined = undefined) => {
    // Get the current wallet from state or use the provided wallet data
    // This avoids the dependency on wallet state
    const targetWallet = walletData || wallet;

    if (!targetWallet || !targetWallet.address || !targetWallet.network) {
      return;
    }

    setIsLoadingBalances(true);
    setError(null);

    try {
      const response = await fetch("/api/get-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: targetWallet.address,
          network: targetWallet.network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch token balances");
      }

      if (data.success && data.balances && data.balances.balances) {
        setTokenBalances(data.balances.balances);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error fetching token balances:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch token balances");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [wallet]); // Include wallet dependency to properly update when wallet changes

  /**
   * Create a new CDP wallet
   * @param fund Whether to fund the wallet (optional)
   */
  const createWallet = useCallback(async (fund: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Ensure we have the latest session data before creating a wallet
      let currentUserId: string | undefined = undefined;
      let userEmail: string | undefined = undefined;
      
      // First try to get email from current session
      if (session && session.user && session.user.email) {
        userEmail = session.user.email;
        console.log('Using email from current session:', userEmail);
      } else {
        // Try to refresh the session data to get email
        try {
          const freshSession = await getCurrentUserSession();
          console.log('Refreshed session data:', freshSession);
          if (freshSession.authenticated && freshSession.session?.user?.email) {
            userEmail = freshSession.session.user.email;
            console.log('Using email from refreshed session:', userEmail);
          }
        } catch (sessionError) {
          console.error('Error refreshing session:', sessionError);
        }
      }
      
      // If we have an email, try to get the user ID from the database
      if (userEmail) {
        try {
          const userId = await getUserIdByEmail(userEmail);
          if (userId) {
            currentUserId = userId;
            console.log('Found user ID from database:', currentUserId);
          } else {
            console.warn('No user found with email:', userEmail);
          }
        } catch (dbError) {
          console.error('Error fetching user ID from database:', dbError);
        }
      }

      const response = await fetch("/api/create-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fund }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create wallet");
      }

      if (data.success && data.wallet) {
        // Create wallet object - the API now includes walletId and userId if available
        const newWallet: SessionWallet = {
          id: data.wallet.id,
          address: data.wallet.address,
          network: data.wallet.network,
          createdAt: Date.now(),
          walletId: data.wallet.walletId || data.wallet.id,
          // Use the user ID from our refreshed session if available
          userId: data.wallet.userId || currentUserId
        };
        
        console.log('Creating wallet with userId:', newWallet.userId);
        console.log('Database save result from API:', data.dbSaved);

        // Save wallet to localStorage for immediate access
        saveWalletToLocalStorage(newWallet);

        // Also save to server-side session for persistence across tabs/browsers
        // The server-side session now also saves to database if user is authenticated
        try {
          const serverSaveResult = await saveWalletToServerSession(newWallet);
          console.log('Server session save result:', serverSaveResult);
        } catch (sessionError) {
          console.warn("Failed to save wallet to server session:", sessionError);
          // Continue even if server session storage fails
        }

        setWallet(newWallet);
        setSuccessMessage(`Wallet created successfully: ${newWallet.address}`);

        // Fetch token balances for the new wallet
        await fetchTokenBalances(newWallet);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokenBalances, session]);  // Include session?.user?.id dependency

  /**
   * Clear wallet information
   */
  const clearWallet = useCallback(async () => {
    // Remove from localStorage
    removeWalletFromLocalStorage();

    // Also remove from server-side session (which now also removes from database if authenticated)
    try {
      await removeWalletFromServerSession();
    } catch (error) {
      console.warn("Failed to remove wallet from server session/database:", error);
      // Continue even if server session removal fails
    }

    setWallet(null);
    setSuccessMessage(null);
    setTokenBalances([]);
  }, []);

  /**
   * Make a call to a paid API endpoint using the current wallet
   */
  const callPaidApiWithWallet = useCallback(async <T,>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: Record<string, unknown>
  ): Promise<T> => {
    if (!wallet) {
      throw new Error("No wallet available. Please create a wallet first.");
    }

    try {
      return await callPaidApi<T>(
        wallet.id,
        endpoint,
        method,
        data,
        wallet.address
      ); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make API call");
      throw err;
    }
  }, [wallet]);

  // Load wallet from database, localStorage, or server session on component mount
  useEffect(() => {
    const fetchWallet = async () => {
      console.log('Starting wallet fetch process...');
      console.log('Session data:', session);
      
      // First try to get wallet from localStorage for quick loading
      const localWallet = getWalletFromLocalStorage();
      console.log('Local wallet from localStorage:', localWallet);
      
      if (localWallet) {
        setWallet(localWallet);
        console.log('Set wallet from localStorage');
        // Don't fetch token balances here - will be handled by the other useEffect
      }

      // If user is authenticated, try to get wallet from server session (which now checks database first)
      // Check for either user ID or email to handle both cases
      if (session?.user?.id || session?.user?.email) {
        console.log('User is authenticated, fetching wallet from server session...');
        try {
          console.log('Calling getWalletFromServerSession()...');
          const serverWallet = await getWalletFromServerSession();
          console.log('Server wallet result:', serverWallet);
          
          if (serverWallet) {
            // If we got a wallet from server/database that's different from localStorage or no localStorage wallet,
            // update the state and localStorage
            if (!localWallet || serverWallet.id !== localWallet.id) {
              console.log('Updating wallet from server session/database');
              setWallet(serverWallet);
              // Also save to localStorage for faster access next time
              saveWalletToLocalStorage(serverWallet);
              // Don't fetch token balances here - will be handled by the other useEffect
            } else {
              console.log('Server wallet matches localStorage wallet, no update needed');
            }
          } else {
            console.log('No wallet found in server session/database');
          }
        } catch (error) {
          console.error("Error fetching wallet from server/database:", error);
        }
      } else {
        console.log('User not authenticated, skipping server wallet fetch');
      }
    };

    fetchWallet();
  }, [session]);
  
  // Fetch balances once when wallet is loaded
  useEffect(() => {
    // Only fetch if we have a wallet
    if (!wallet) return;
    
    // Initial fetch - only do this once when wallet is first set
    fetchTokenBalances(wallet);
    
    // No polling interval - will only update on manual refresh
  }, [wallet, fetchTokenBalances]); // Include fetchTokenBalances in dependencies

  // Context value
  const contextValue: CdpWalletContextType = {
    wallet,
    isLoading,
    error,
    successMessage,
    tokenBalances,
    isLoadingBalances,
    createWallet,
    clearWallet,
    fetchTokenBalances,
    callPaidApiWithWallet,
    setError,
    setSuccessMessage,
  };

  return (
    <CdpWalletContext.Provider value={contextValue}>
      {children}
    </CdpWalletContext.Provider>
  );
}

// Custom hook to use the CDP wallet context
export function useCdpWallet() {
  const context = useContext(CdpWalletContext);
  if (context === undefined) {
    throw new Error("useCdpWallet must be used within a CdpWalletProvider");
  }
  return context;
}
