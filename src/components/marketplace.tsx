"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

const agents = [
  {
    name: "Content Creator Pro",
    description: "Summarize → Translate → Generate social media content",
    price: "0.05",
    rating: 4.9,
    users: "2.3k",
    tags: ["Content", "Social Media", "Translation"],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Research Assistant",
    description: "Analyze → Summarize → Generate insights from documents",
    price: "0.08",
    rating: 4.8,
    users: "1.8k",
    tags: ["Research", "Analysis", "Documents"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Visual Storyteller",
    description: "Text analysis → Story generation → Image creation",
    price: "0.12",
    rating: 4.7,
    users: "1.2k",
    tags: ["Creative", "Visual", "Storytelling"],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Data Processor",
    description: "Clean → Analyze → Visualize data workflows",
    price: "0.06",
    rating: 4.9,
    users: "3.1k",
    tags: ["Data", "Analytics", "Visualization"],
    gradient: "from-yellow-500 to-orange-500",
  },
];

export function Marketplace() {
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Marketplace Spotlight
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover top-performing AI agents and workflows created by our
            community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/40 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-500 transform hover:scale-105 cursor-pointer"
              onMouseEnter={() => setHoveredAgent(index)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              {/* Animated background */}
              <div
                className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500
                bg-gradient-to-br ${agent.gradient}
              `}
              />

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${agent.gradient} shadow-lg
                  ${hoveredAgent === index ? "scale-110" : ""}
                  transition-transform duration-300
                `}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-yellow-400 mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{agent.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400 text-xs">
                    <Users className="w-3 h-3" />
                    <span>{agent.users}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                {agent.name}
              </h3>

              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {agent.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {agent.tags.map((tag, tagIndex) => (
                  <Badge
                    key={tagIndex}
                    variant="secondary"
                    className="text-xs bg-gray-800/50 text-gray-300 border-gray-600/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Price and CTA */}
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <span className="text-lg font-bold">${agent.price}</span>
                  <span className="text-gray-400 text-sm ml-1">per call</span>
                </div>
                <Link href="/services">
                  <Button
                    size="sm"
                    className={`
                      cursor-pointer
                  bg-gradient-to-r ${
                    agent.gradient
                  } hover:shadow-lg transition-all duration-300
                  ${hoveredAgent === index ? "shadow-lg scale-105" : ""}
                `}
                  >
                    Try Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: TrendingUp, value: "100+", label: "API Calls Processed" },
            { icon: Users, value: "10+", label: "Active Developers" },
            { icon: Zap, value: "10+", label: "AI Agents Available" },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-800/20 border border-gray-700/30 backdrop-blur-sm"
            >
              <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
