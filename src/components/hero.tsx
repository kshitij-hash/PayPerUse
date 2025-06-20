"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Workflow, Coins, Play, Sparkles } from "lucide-react"
import Link from "next/link"

export function Hero() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const workflowSteps = [
    {
      icon: "📝",
      label: "Summarize",
      color: "from-purple-500 to-pink-500",
      description: "Extract key insights",
    },
    {
      icon: "🌐",
      label: "Translate",
      color: "from-blue-500 to-cyan-500",
      description: "Multi-language support",
    },
    {
      icon: "🎨",
      label: "Generate",
      color: "from-green-500 to-emerald-500",
      description: "Create visual content",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % workflowSteps.length)
        setIsAnimating(false)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Dynamic background with moving gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 animate-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-transparent via-purple-500/5 to-transparent animate-spin-slow" />
      </div>

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 text-center max-w-7xl mx-auto">
        {/* Main content container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-left lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm mb-0 mt-4">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Powered by x402 & CDP Wallet</span>
            </div>

            {/* Main heading */}
            <div>
              <h1 className="text-6xl lg:text-8xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient">
                  Flow
                </span>
              </h1>
              <h2 className="text-2xl lg:text-4xl font-light text-gray-300 mb-6 leading-relaxed">
                Composable AI Agent
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                  Marketplace
                </span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed max-w-2xl">
              Build, monetize, and run multi-step AI workflows with seamless payments. Each service call is secured with
              x402 headers while revenue flows automatically to creators through decentralized infrastructure.
            </p>

            {/* Key features */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, text: "Pay-per-Call APIs" },
                { icon: Workflow, text: "Multi-step Workflows" },
                { icon: Coins, text: "Auto Revenue Split" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-700/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  <feature.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/services">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  Start Exploring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {/* <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-800 hover:bg-gray-800 hover:text-white hover:border-gray-500 px-8 py-4 text-lg rounded-2xl transition-all duration-300 backdrop-blur-sm"
              >
                Explore Marketplace
              </Button> */}
            </div>
          </div>

          {/* Right side - Interactive workflow visualization */}
          <div className="relative pb-24 md:pb-16">
            {/* Main workflow container */}
            <div className="relative p-6 md:p-8">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl blur-xl" />

              {/* Workflow steps */}
              <div className="relative space-y-8">
                {workflowSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`
                      relative flex items-center space-x-6 p-6 rounded-2xl transition-all duration-700 transform
                      ${
                        currentStep === index
                          ? "bg-gradient-to-r from-gray-800/80 to-gray-700/60 border border-gray-600/50 scale-105 shadow-2xl"
                          : "bg-gray-900/30 border border-gray-800/50 hover:bg-gray-800/40"
                      }
                      ${isAnimating && currentStep === index ? "animate-pulse" : ""}
                    `}
                  >
                    {/* Step icon */}
                    <div
                      className={`
                        relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500
                        ${
                          currentStep === index
                            ? `bg-gradient-to-br ${step.color} shadow-lg scale-110`
                            : "bg-gray-800 scale-100"
                        }
                      `}
                    >
                      {step.icon}
                      {currentStep === index && (
                        <>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-spin-slow" />
                          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-lg animate-pulse" />
                        </>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1">
                      <h3
                        className={`
                        text-xl font-bold mb-1 transition-all duration-300
                        ${
                          currentStep === index
                            ? "text-transparent bg-gradient-to-r from-white to-gray-200 bg-clip-text"
                            : "text-gray-300"
                        }
                      `}
                      >
                        {step.label}
                      </h3>
                      <p
                        className={`
                        text-sm transition-colors duration-300
                        ${currentStep === index ? "text-gray-300" : "text-gray-500"}
                      `}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Active indicator */}
                    {currentStep === index && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse shadow-lg shadow-purple-400/50" />
                    )}

                    {/* Connection line */}
                    {index < workflowSteps.length - 1 && (
                      <div className="absolute -bottom-4 left-14 w-0.5 h-8 bg-gradient-to-b from-gray-600 to-transparent" />
                    )}
                  </div>
                ))}
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce opacity-60" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-bounce delay-1000 opacity-60" />
            </div>

            {/* Stats overlay */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-4 md:space-x-8 text-center">
              <div className="px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-700/50 backdrop-blur-sm">
                <div className="text-lg font-bold text-white">100+</div>
                <div className="text-xs text-gray-400">API Calls</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-700/50 backdrop-blur-sm">
                <div className="text-lg font-bold text-white">10+</div>
                <div className="text-xs text-gray-400">AI Agents</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
