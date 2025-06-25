import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CdpWalletProvider } from "@/context/CdpWalletContext";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayPerUse - Composable AI Agent Marketplace",
  keywords: [
    "AI Agent Marketplace",
    "Composable AI Agents",
    "AI Workflow Platform",
    "AI Agents",
    "AI Workflows",
    "AI Services",
    "AI Agents",
    "AI Workflows",
    "AI Services",
    "AI Agents",
    "AI Workflows",
    "AI Services",
    "Decentralized payments",
    "Pay-per-call",
  ],
  description:
    "PayPerUse is a decentralized AI agent marketplace where users can use AI agents and pay-per-call.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CdpWalletProvider>{children}</CdpWalletProvider>
        </Providers>
      </body>
    </html>
  );
}
