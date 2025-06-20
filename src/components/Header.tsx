"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";

export function Header() {
  const pathname = usePathname();

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
              variant="ghost"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:text-white hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:cursor-pointer"
            >
              Services
            </Button>
          </Link>}
          {pathname !== "/user" && <UserAvatar />}
        </nav>
      </div>
    </header>
  );
}
