"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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

interface WalletCardProps {
  wallet: {
    id: string;
    address: string | null;
    network: string | null;
  };
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const [balance, setBalance] = useState<TokenBalance[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!wallet.address) return;

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
      setError("Failed to fetch balance.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.address, wallet.network]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-white">Wallet Information</CardTitle>
                <CardDescription className="text-gray-400">
                Here are your connected wallet details.
                </CardDescription>
            </div>
            <Button onClick={fetchBalance} disabled={isLoading} size="icon" variant="ghost">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-300">
          Address: {wallet.address}
        </p>
        <p className="text-sm text-gray-300">
          Network: {wallet.network}
        </p>
        {balance && balance.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Token Balances</h4>
            <div className="space-y-1">
              {balance.map((tokenBalance) => (
                <div key={tokenBalance.token.contractAddress} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">
                    Token ({tokenBalance.token.contractAddress.slice(0, 6)}...{tokenBalance.token.contractAddress.slice(-4)})
                  </span>
                  <span className="font-mono text-white">
                    {formatUnits(BigInt(tokenBalance.amount.amount), tokenBalance.amount.decimals)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
