import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function User() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-scree text-white overflow-hidden">
      <h1>User</h1>
      <p>{session.user?.email}</p>
      <p>{session.user?.name}</p>
      <p>{session.user?.id || "no id"}</p>
      <Image src={session.user?.image || ""} alt="" width={100} height={100} />
      <SignOut />
    </main>
  );
}
