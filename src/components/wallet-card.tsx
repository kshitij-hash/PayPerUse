"use client";

import { useEffect, useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { mainnet } from "viem/chains";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const usdcContractAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
];

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

interface WalletCardProps {
  wallet: {
    id: string;
    address: string | null;
    network: string | null;
  };
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!wallet.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const checksumAddress = getAddress(wallet.address);
      const balance = await publicClient.readContract({
        address: usdcContractAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [checksumAddress],
      });
      setBalance(formatUnits(balance as bigint, 6));
    } catch (err) {
      setError("Failed to fetch balance.");
      console.error(err);
    }

    setIsLoading(false);
  }, [wallet.address]);

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
        {balance !== null && (
            <p className="text-sm font-medium text-white">USDC Balance: {balance}</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
