'use client';

import { useState, useEffect } from 'react';
import { 
  saveWalletToLocalStorage, 
  getWalletFromLocalStorage, 
  removeWalletFromLocalStorage,
  saveWalletToServerSession,
  removeWalletFromServerSession,
  getWalletFromServerSession,
  SessionWallet
} from '@/lib/sessionWalletManager';
import { callPaidApi } from '@/lib/x402Client';

// Define token balance interface
interface TokenBalance {
  token: {
    name?: string;
    symbol?: string;
    decimals?: number;
    network?: string;
    contractAddress?: string;
  };
  amount: string | {
    amount: string;
    decimals: number;
  };
  usdValue?: string;
}

/**
 * CDP Wallet Manager Component
 * 
 * This component provides UI and functionality for:
 * - Creating a CDP wallet
 * - Checking wallet status
 * - Making paid API calls using the CDP wallet
 */
export default function CdpWalletManager() {
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
        console.error('Error fetching wallet from server session:', error);
      }
    };
    
    fetchWallet();
  }, []);

  /**
   * Create a new CDP wallet
   * @param fund Whether to fund the wallet (optional)
   */
  const createWallet = async (fund: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/create-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fund }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      if (data.success && data.wallet) {
        // Create wallet object
        const newWallet: SessionWallet = {
          id: data.wallet.id,
          address: data.wallet.address,
          network: data.wallet.network,
          createdAt: Date.now()
        };

        // Save wallet to localStorage for immediate access
        saveWalletToLocalStorage(newWallet);
        
        // Also save to server-side session for persistence across tabs/browsers
        try {
          await saveWalletToServerSession(newWallet);
        } catch (sessionError) {
          console.warn('Failed to save wallet to server session:', sessionError);
          // Continue even if server session storage fails
        }
        
        setWallet(newWallet);
        setSuccessMessage(`Wallet created successfully: ${newWallet.address}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear wallet information
   */
  const clearWallet = async () => {
    // Remove from localStorage
    removeWalletFromLocalStorage();
    
    // Also remove from server-side session
    try {
      await removeWalletFromServerSession();
    } catch (error) {
      console.warn('Failed to remove wallet from server session:', error);
      // Continue even if server session removal fails
    }
    
    setWallet(null);
    setSuccessMessage(null);
  };

  /**
   * Make a test call to a paid API endpoint
   */
  const testPaidApiCall = async () => {
    if (!wallet) {
      setError('No wallet available. Please create a wallet first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Example: Call the summarize API
      const response = await callPaidApi(
        wallet.id,
        '/api/summarize',
        'POST',
        { input: 'This is a test text that needs to be summarized.' },
        wallet.address
      );

      setSuccessMessage('API call successful: ' + JSON.stringify(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make API call');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch token balances for a wallet
   */
  const fetchTokenBalances = async (walletData: SessionWallet) => {
    if (!walletData || !walletData.address || !walletData.network) {
      return;
    }

    setIsLoadingBalances(true);
    setError(null);

    try {
      const response = await fetch('/api/get-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletData.address,
          network: walletData.network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch token balances');
      }

      if (data.success && data.balances && data.balances.balances) {
        setTokenBalances(data.balances.balances);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching token balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
    } finally {
      setIsLoadingBalances(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">CDP Wallet Manager</h2>
      
      {/* Wallet Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded text-black">
        <h3 className="font-semibold">Wallet Status</h3>
        {wallet ? (
          <div>
            <p><span className="font-medium">Address:</span> {wallet.address}</p>
            <p><span className="font-medium">ID:</span> {wallet.id}</p>
            <p><span className="font-medium">Network:</span> {wallet.network}</p>
            <p><span className="font-medium">Created:</span> {new Date(wallet.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <p>No wallet connected</p>
        )}
      </div>
      
      {/* Token Balances */}
      {wallet && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-black">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Token Balances</h3>
            <button
              onClick={() => fetchTokenBalances(wallet)}
              disabled={isLoadingBalances}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoadingBalances ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {isLoadingBalances ? (
            <p className="text-gray-600">Loading balances...</p>
          ) : tokenBalances.length > 0 ? (
            <div className="space-y-2">
              {tokenBalances.map((balance, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{balance.token.symbol || 'Token'}</span>
                    <span>
                      {typeof balance.amount === 'object' ? 
                        parseFloat(balance.amount.amount) / Math.pow(10, balance.amount.decimals) : 
                        parseFloat(balance.amount) / Math.pow(10, balance.token?.decimals || 0)
                      }
                      {balance.usdValue && ` ($${balance.usdValue})`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {balance.token.name || 'Unknown Token'}
                    {balance.token.contractAddress && (
                      <span className="ml-1">({balance.token.contractAddress.substring(0, 6)}...{balance.token.contractAddress.substring(38)})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No token balances found</p>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => createWallet(false)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Create Wallet
        </button>
        
        <button
          onClick={() => createWallet(true)}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Create & Fund Wallet
        </button>
        
        {wallet && (
          <>
            <button
              onClick={testPaidApiCall}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Paid API Call
            </button>
            
            <button
              onClick={() => fetchTokenBalances(wallet)}
              disabled={isLoadingBalances}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Refresh Balances
            </button>
            
            <button
              onClick={clearWallet}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Clear Wallet
            </button>
          </>
        )}
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-4">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          <p>{successMessage}</p>
        </div>
      )}
    </div>
  );
}
