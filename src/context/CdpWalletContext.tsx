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
  saveWalletToServerSession,
  removeWalletFromServerSession,
  getWalletFromServerSession,
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
  }, []); // Remove wallet dependency to break the cycle

  /**
   * Create a new CDP wallet
   * @param fund Whether to fund the wallet (optional)
   */
  const createWallet = useCallback(async (fund: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
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
        // Create wallet object
        const newWallet: SessionWallet = {
          id: data.wallet.id,
          address: data.wallet.address,
          network: data.wallet.network,
          createdAt: Date.now(),
        };

        // Save wallet to localStorage for immediate access
        saveWalletToLocalStorage(newWallet);

        // Also save to server-side session for persistence across tabs/browsers
        try {
          await saveWalletToServerSession(newWallet);
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
  }, [fetchTokenBalances]);

  /**
   * Clear wallet information
   */
  const clearWallet = useCallback(async () => {
    // Remove from localStorage
    removeWalletFromLocalStorage();

    // Also remove from server-side session
    try {
      await removeWalletFromServerSession();
    } catch (error) {
      console.warn("Failed to remove wallet from server session:", error);
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

  // Load wallet from localStorage or server session on component mount
  useEffect(() => {
    const fetchWallet = async () => {
      // First try to get wallet from localStorage
      const localWallet = getWalletFromLocalStorage();
      if (localWallet) {
        setWallet(localWallet);
        // Fetch token balances for the wallet
        fetchTokenBalances(localWallet);
        return;
      }

      // If not in localStorage, try to get from server session
      try {
        const serverWallet = await getWalletFromServerSession();
        if (serverWallet) {
          setWallet(serverWallet);
          // Also save to localStorage for faster access next time
          saveWalletToLocalStorage(serverWallet);
          // Fetch token balances for the wallet
          fetchTokenBalances(serverWallet);
        }
      } catch (error) {
        console.error("Error fetching wallet from server session:", error);
      }
    };

    fetchWallet();
  }, [fetchTokenBalances]);
  
  // Set up a polling interval for balance updates
  useEffect(() => {
    // Only set up polling if we have a wallet
    if (!wallet) return;
    
    // Initial fetch - only do this once when wallet is first set
    fetchTokenBalances(wallet);
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      // Use the current wallet from the closure to avoid dependency issues
      if (wallet) {
        fetchTokenBalances(wallet);
      }
    }, 30000); // 30 seconds
    
    // Clean up interval on unmount or when wallet changes
    return () => clearInterval(intervalId);
  }, [wallet]); // Only depend on wallet, not fetchTokenBalances

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
