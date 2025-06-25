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
  console.log("wallet", wallet);

  return (
    <div className="relative flex flex-col items-center min-h-screen pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      <Header />
      <div className="w-full max-w-md p-4">
        <Card className="mb-4 bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
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
          className="w-full mt-4"
        >
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:cursor-pointer"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
