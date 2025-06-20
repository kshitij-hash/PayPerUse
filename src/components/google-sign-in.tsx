import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { signIn } from "@/lib/auth";

const GoogleSignIn = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button className="w-full" variant="outline">
        <FaGoogle />
        Continue with Google
      </Button>
    </form>
  );
};

export { GoogleSignIn };
