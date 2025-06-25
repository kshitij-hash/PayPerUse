import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import payperuseLogo from "../../public/ppu_logo.png";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Image
              src={payperuseLogo}
              alt="PayPerUse"
              width={130}
              height={130}
            />
          </div>

          <div className="flex space-x-6">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-gray-400">
          <p>
            &copy; 2025 PayPerUse. Building the future of composable AI workflows.
          </p>
        </div>
      </div>
    </footer>
  );
}
