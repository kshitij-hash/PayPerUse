'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { useCdpWallet } from '@/context/CdpWalletContext';
import LoadingButton from '@/components/ui/LoadingButton';
import StatusMessage from '@/components/ui/StatusMessage';
import WalletDisplay from '@/components/ui/WalletDisplay';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: string;
  currency: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export default function WalletPage() {
  const { 
    wallet, 
    isLoading, 
    error, 
    successMessage, 
    tokenBalances, 
    isLoadingBalances, 
    createWallet, 
    clearWallet, 
    fetchTokenBalances 
  } = useCdpWallet();
  
  // Mock transactions for now - in a real implementation, these would come from the CDP Wallet API
  const [transactions] = useState<Transaction[]>([
    {
      id: 'tx-001',
      type: 'deposit',
      amount: '50.00',
      currency: 'USDC',
      timestamp: '2025-06-18T10:30:00Z',
      status: 'completed',
      description: 'Deposit from wallet'
    },
    {
      id: 'tx-002',
      type: 'payment',
      amount: '0.10',
      currency: 'USDC',
      timestamp: '2025-06-17T15:45:00Z',
      status: 'completed',
      description: 'Payment for Image Generation Agent'
    },
    {
      id: 'tx-003',
      type: 'payment',
      amount: '0.05',
      currency: 'USDC',
      timestamp: '2025-06-16T09:20:00Z',
      status: 'completed',
      description: 'Payment for Data Analysis Agent'
    },
    {
      id: 'tx-004',
      type: 'deposit',
      amount: '50.00',
      currency: 'USDC',
      timestamp: '2025-06-15T14:10:00Z',
      status: 'completed',
      description: 'Initial deposit'
    }
  ]);

  // Note: Total balance calculation is now handled by the WalletDisplay component

  // Format date for better readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-b-gray-800/50 bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between p-6">
          <Link href="/" className="font-bold text-2xl">
            Flow
          </Link>
          <nav>
            <ul className="flex items-center space-x-6">
              <li>
                <Link
                  href="/wallet"
                  className="text-white font-semibold"
                >
                  Wallet
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Services
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Wallet</h1>
          <p className="text-gray-400">Manage your balance and view transaction history</p>
        </div>

        {/* Display error or success messages if any */}
      {error && <StatusMessage type="error" message={error} className="mb-6" />}
      {successMessage && <StatusMessage type="success" message={successMessage} className="mb-6" />}
      
      {!wallet ? (
          <div className="bg-gray-900/80 rounded-xl p-8 text-center border border-gray-800/50 backdrop-blur-sm">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Connect your wallet to view your balance and transaction history</p>
              <div className="flex space-x-4 justify-center">
                <LoadingButton
                  isLoading={isLoading}
                  loadingText="Creating..."
                  onClick={() => createWallet(false)}
                  variant="primary"
                >
                  Create Wallet
                </LoadingButton>
                
                <LoadingButton
                  isLoading={isLoading}
                  loadingText="Creating..."
                  onClick={() => createWallet(true)}
                  variant="success"
                >
                  Create & Fund Wallet
                </LoadingButton>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              By connecting your wallet, you agree to the terms of service and privacy policy.
            </p>
          </div>
        ) : (
          <div>
            {/* Balance Card */}
            <div className="bg-gray-900/80 rounded-xl p-6 mb-8 border border-gray-800/50 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Balance</h2>
                <div className="flex space-x-4">
                  <LoadingButton
                    onClick={() => fetchTokenBalances()}
                    isLoading={isLoadingBalances}
                    loadingText="Refreshing..."
                    variant="primary"
                    className="text-sm px-3 py-1 text-white"
                  >
                    Refresh Balance
                  </LoadingButton>
                  <button
                    onClick={clearWallet}
                    disabled={isLoading}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
              <WalletDisplay wallet={wallet} tokenBalances={tokenBalances} />
            </div>

            {/* Transaction History */}
            <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No transactions found</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-800/80 rounded-xl p-4 flex justify-between items-center border border-gray-700/50">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                          tx.type === 'deposit' ? 'bg-green-600/20 text-green-400' :
                          tx.type === 'withdrawal' ? 'bg-red-600/20 text-red-400' :
                          'bg-blue-600/20 text-blue-400'
                        }`}>
                          {tx.type === 'deposit' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : tx.type === 'withdrawal' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                              <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          tx.type === 'deposit' ? 'text-green-400' :
                          tx.type === 'withdrawal' || tx.type === 'payment' ? 'text-red-400' :
                          'text-white'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                        </p>
                        <p className={`text-xs ${
                          tx.status === 'completed' ? 'text-green-400' :
                          tx.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
