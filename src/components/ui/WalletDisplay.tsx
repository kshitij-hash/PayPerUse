'use client';

import React from 'react';
import { SessionWallet } from '@/lib/sessionWalletManager';
import { TokenBalance } from '@/context/CdpWalletContext';

interface WalletDisplayProps {
  wallet: SessionWallet | null;
  tokenBalances: TokenBalance[];
  className?: string;
}

export default function WalletDisplay({
  wallet,
  tokenBalances,
  className = ''
}: WalletDisplayProps) {
  if (!wallet) return null;

  // Helper function to get total balance from token balances
  const getTotalBalance = () => {
    if (!tokenBalances || tokenBalances.length === 0) return '0.00';
    
    // Find USDC balance if available
    const usdcBalance = tokenBalances.find(balance => 
      balance.token.symbol?.toUpperCase() === 'USDC'
    );
    
    if (usdcBalance) {
      if (typeof usdcBalance.amount === 'object') {
        return (parseFloat(usdcBalance.amount.amount) / Math.pow(10, usdcBalance.amount.decimals)).toFixed(2);
      } else {
        return (parseFloat(usdcBalance.amount) / Math.pow(10, usdcBalance.token?.decimals || 0)).toFixed(2);
      }
    }
    
    // If no USDC, return the first token's balance
    const firstBalance = tokenBalances[0];
    if (typeof firstBalance.amount === 'object') {
      return (parseFloat(firstBalance.amount.amount) / Math.pow(10, firstBalance.amount.decimals)).toFixed(2);
    } else {
      return (parseFloat(firstBalance.amount) / Math.pow(10, firstBalance.token?.decimals || 0)).toFixed(2);
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-300 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">{getTotalBalance()} {tokenBalances.length > 0 ? (tokenBalances[0].token.symbol || 'USDC') : 'USDC'}</p>
          <p className="text-xs text-gray-400 mt-1">Wallet Address: {formatAddress(wallet.address)}</p>
        </div>
        <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
