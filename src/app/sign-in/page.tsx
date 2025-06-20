import { GoogleSignIn } from "@/components/google-sign-in";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  console.log("Session:", session);

  if (session) {
    redirect("/user");
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        Authenticate to continue
      </h1>
      <GoogleSignIn />
    </div>
  );
};

export default Page;
