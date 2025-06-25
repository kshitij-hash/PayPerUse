"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Wallet, Zap, Bot, Coins } from "lucide-react"

const steps = [
  {
    icon: Wallet,
    title: "Fund Your CDP Wallet",
    description: "One-time funding enables all your AI workflow executions",
    details:
      "Connect your Coinbase CDP Wallet and fund it once. This balance will be used for all your AI workflow calls across the platform.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "Select AI Workflow",
    description: "Choose from marketplace or create custom multi-step workflows",
    details:
      "Browse our marketplace of pre-built AI agents or compose your own workflows by chaining different AI services together.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Execute with x402",
    description: "Secure API calls with automatic payment verification",
    details:
      "Each AI service call is secured with x402 headers, ensuring authentic service delivery and automatic payment processing.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Coins,
    title: "Auto Payment Split",
    description: "Revenue distributed on-chain to all service providers",
    details:
      "Payments are automatically split and routed to service providers and agent creators based on usage, all handled on-chain.",
    color: "from-yellow-500 to-orange-500",
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 px-4 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            How PayPerUse Works
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From wallet funding to revenue distribution, everything is automated and decentralized
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps navigation */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`
                  relative p-6 rounded-2xl cursor-pointer transition-all duration-500 transform
                  ${
                    activeStep === index
                      ? "bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-l-4 scale-105"
                      : "bg-gray-900/30 hover:bg-gray-800/50"
                  }
                  border border-gray-700/50 backdrop-blur-sm
                `}
                onClick={() => setActiveStep(index)}
              >
                <div
                  className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-500
                  ${activeStep === index ? `bg-gradient-to-b ${step.color}` : "bg-transparent"}
                `}
                />

                <div className="flex items-start space-x-4">
                  <div
                    className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                    ${activeStep === index ? `bg-gradient-to-br ${step.color} shadow-lg` : "bg-gray-800"}
                  `}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`
                      text-lg font-semibold mb-2 transition-colors duration-300
                      ${activeStep === index ? "text-white" : "text-gray-300"}
                    `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>

                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${activeStep === index ? `bg-gradient-to-br ${step.color} text-white` : "bg-gray-800 text-gray-500"}
                  `}
                  >
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active step details */}
          <div className="relative">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
              <div
                className={`
                w-20 h-20 rounded-2xl mb-6 flex items-center justify-center
                bg-gradient-to-br ${steps[activeStep].color} shadow-2xl
              `}
              >
                {React.createElement(steps[activeStep].icon, { className: "w-10 h-10 text-white" })}
              </div>

              <h3 className="text-2xl font-bold mb-4 text-white">{steps[activeStep].title}</h3>

              <p className="text-gray-300 leading-relaxed text-lg">{steps[activeStep].details}</p>
            </div>

            {/* Animated connection lines */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
              <div className="w-1 h-16 bg-gradient-to-b from-purple-500 to-transparent mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
