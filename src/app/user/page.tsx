import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import WalletCard from "@/components/wallet-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/Header";

export default async function User() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user;

  const wallet = await prisma.wallet.findFirst({
    where: {
      userId: user.id,
    },
  });
  const pinataFiles = await prisma.pinataFile.findMany({
    where: {
      userId: user.id,
    },
  });

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
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <CardTitle className="text-white">{user.name}</CardTitle>
                  <CardDescription className="text-gray-400">{user.email}</CardDescription>
                </div>
              </CardHeader>
            </Card>

            {wallet ? (
              <WalletCard wallet={wallet} />
            ) : (
              <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>No Wallet Found</CardTitle>
                  <CardDescription>Please connect a wallet.</CardDescription>
                </CardHeader>
              </Card>
            )}

            <form
              action={async () => {
                "use server";
                await signOut();
              }}
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
                  <CardDescription className="text-gray-400">Your uploaded files on Pinata.</CardDescription>
                </CardHeader>
                <div className="p-4">
                  <Table>
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
                          <TableCell className="text-gray-300">{file.name}</TableCell>
                          <TableCell className="text-gray-300">{file.pinSize} bytes</TableCell>
                          <TableCell className="text-gray-300">{new Date(file.timestamp).toLocaleDateString()}</TableCell>
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
              <Card className="h-full flex items-center justify-center bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-white">No Files Uploaded</CardTitle>
                  <CardDescription className="text-gray-400">You haven&apos;t uploaded any files to Pinata yet.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
