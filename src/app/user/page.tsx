"use client";

import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WalletCard from "@/components/wallet-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Header } from "@/components/Header";
import { useCdpWallet } from "@/context/CdpWalletContext";
import { useEffect, useState } from "react";
import LoadingButton from "@/components/ui/LoadingButton";
import StatusMessage from "@/components/ui/StatusMessage";
import { handleSignOut } from "@/app/actions/auth-actions";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface PinataFile {
  id: string;
  name: string;
  pinSize: number;
  ipfsHash: string;
  timestamp: string;
}

export default function User() {
  const [pinataFiles, setPinataFiles] = useState<PinataFile[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    wallet,
    isLoading: walletLoading,
    error,
    successMessage,
    createWallet,
  } = useCdpWallet();

  // Fetch user data and wallet from server
  useEffect(() => {
    async function fetchUserData() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        if (!sessionData.user) {
          window.location.href = "/sign-in";
          return;
        }

        setUser(sessionData.user);

        // Fetch wallet and pinata files
        const [walletRes, filesRes] = await Promise.all([
          fetch(`/api/wallet?userId=${sessionData.user.id}`),
          fetch(`/api/pinata-files?userId=${sessionData.user.id}`),
        ]);

        const walletData = await walletRes.json();
        const filesData = await filesRes.json();

        if (walletData.wallet) {
          console.log("Server wallet found:", walletData.wallet);
        }

        if (filesData.files) {
          setPinataFiles(filesData.files);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="relative flex flex-col min-h-screen pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading user data...</p>
          </div>
        </main>
      </div>
    );
  }

  // If no user, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="relative flex flex-col min-h-screen pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback>
                    {user?.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm text-white font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-400">{user?.email || ""}</p>
                </div>
              </CardHeader>
            </Card>

            {/* Display error or success messages if any */}
            {error && (
              <StatusMessage type="error" message={error} className="mb-6" />
            )}
            {successMessage && (
              <StatusMessage
                type="success"
                message={successMessage}
                className="mb-6"
              />
            )}

            {wallet ? (
              <WalletCard wallet={wallet} />
            ) : (
              <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>No Wallet Connected</CardTitle>
                  <CardDescription>
                    Create a wallet to use our services
                  </CardDescription>
                  <div className="mt-4 flex justify-center">
                    <LoadingButton
                      isLoading={walletLoading}
                      loadingText="Creating..."
                      onClick={() => createWallet()}
                      variant="primary"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
                    >
                      Create Wallet
                    </LoadingButton>
                  </div>
                </CardHeader>
              </Card>
            )}

            <form
              action={handleSignOut}
              className="w-full"
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:cursor-pointer"
              >
                Sign Out
              </Button>
            </form>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            {pinataFiles.length > 0 ? (
              <Card className="h-full bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Uploaded Files</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your uploaded files on Pinata.
                  </CardDescription>
                </CardHeader>
                <div className="p-4">
                  <Table className="hover:forced-color-adjust-none">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Size</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pinataFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="text-gray-300">
                            {file.name}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {file.pinSize} bytes
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(file.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:underline"
                            >
                              View on IPFS
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    No Files Uploaded
                  </h2>
                  <p className="text-gray-400 mb-2">
                    You haven&apos;t uploaded any files to Pinata yet.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
