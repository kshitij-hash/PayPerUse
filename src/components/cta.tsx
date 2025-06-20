"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Github, Twitter } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-24 px-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.1)_0%,transparent_50%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
          Ready to Build the Future?
        </h2>

        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of developers and creators building the next generation of AI workflows. Start monetizing your
          AI services today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/services">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
            >
              Start Exploring
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="border-gray-600 text-gray-800 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg rounded-xl transition-all duration-300"
          >
            View Documentation
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex justify-center space-x-8 text-gray-400">
          <div className="flex items-center space-x-2 hover:text-white transition-colors cursor-pointer">
            <Github className="w-5 h-5" />
            <span>Open Source</span>
          </div>
          <div className="flex items-center space-x-2 hover:text-white transition-colors cursor-pointer">
            <Twitter className="w-5 h-5" />
            <span>Follow Updates</span>
          </div>
        </div>
      </div>
    </section>
  )
}
