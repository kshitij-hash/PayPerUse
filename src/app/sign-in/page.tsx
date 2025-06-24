import { GoogleSignIn } from "@/components/google-sign-in";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Page = async () => {
  const session = await auth();
  console.log("Session:", session);

  if (session) {
    redirect("/user");
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      <Header />
      
      <div className="w-full max-w-md p-6 mt-10">
        <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-400">
              Authenticate to access your FlowForge account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 pt-4">
            <GoogleSignIn />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
