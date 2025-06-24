"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { Wallet, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getWalletFromLocalStorage, SessionWallet } from "../lib/sessionWalletManager";
import { formatUnits } from "viem";

interface TokenBalance {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    contractAddress: string;
    network: string;
  };
}

export function WalletButton() {
  const [wallet, setWallet] = useState<SessionWallet | null>(null);
  const [balance, setBalance] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/get-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: wallet.address,
          network: wallet.network,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch token balances");
      }

      if (data.success && data.balances && data.balances.balances) {
        setBalance(data.balances.balances);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [wallet?.address, wallet?.network]);

  useEffect(() => {
    // Get wallet from localStorage on component mount
    const storedWallet = getWalletFromLocalStorage();
    setWallet(storedWallet);

    // Fetch balance if wallet exists
    if (storedWallet?.address) {
      fetchBalance();
    }

    // Set up event listener for wallet changes
    const handleStorageChange = () => {
      const updatedWallet = getWalletFromLocalStorage();
      setWallet(updatedWallet);
      if (updatedWallet?.address) {
        fetchBalance();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchBalance]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-purple-900/20 transition-all duration-300"
        >
          <Wallet className="h-5 w-5 text-purple-400" />
          {wallet && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-black/80 border border-purple-500/30 text-white backdrop-blur-lg">
        {wallet ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Wallet Connected</p>
                <p className="text-xs text-gray-400 truncate">{wallet.address}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <div className="p-2">
              <div className="bg-purple-900/30 rounded-md p-2 border border-purple-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">USDC Balance:</span>
                  <div className="flex items-center gap-1">
                    {isLoading ? (
                      <span className="text-sm font-bold text-purple-300 flex items-center">
                        <span className="animate-pulse">Loading...</span>
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-purple-300">
                      {balance.length > 0
                        ? formatUnits(
                            BigInt(balance[0].amount.amount),
                            balance[0].amount.decimals
                          )
                        : "0.00"}
                    </span>
                    )}
                    <Button 
                      onClick={fetchBalance} 
                      disabled={isLoading} 
                      size="icon" 
                      variant="ghost" 
                      className="h-5 w-5 p-0 hover:bg-purple-500/20"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-300">Network:</span>
                  <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded-full text-purple-300">
                    {wallet.network || "base-sepolia"}
                  </span>
                </div>
                {error && (
                  <div className="mt-1 text-xs text-red-400 text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/user" className="cursor-pointer text-sm text-center justify-center hover:bg-purple-500/20">
                Manage Wallet
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-yellow-400">Wallet Not Connected</p>
                <p className="text-xs text-gray-400">Connect a wallet to use services</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-purple-500/20" />
            <DropdownMenuItem asChild>
              <Link href="/user" className="cursor-pointer text-sm text-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Connect Wallet
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-gray-800/50">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient">
            Flow
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          {pathname !== "/services" && <Link href="/services" passHref>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:text-white hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:cursor-pointer"
            >
              Services
            </Button>
          </Link>}
          {status === "authenticated" && <WalletButton />}
          {pathname !== "/user" && pathname !== "/sign-in" && <UserAvatar />}
        </nav>
      </div>
    </header>
  );
}
