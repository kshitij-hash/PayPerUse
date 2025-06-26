"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Bot } from "lucide-react";

interface InputField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  rows?: number;
  className?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  pricing: {
    amount: string;
    currency: string;
  };
  payoutAddress: string;
  provider: string;
  inputs?: InputField[];
}

const ServiceSkeleton = () => (
  <Card className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm flex flex-col">
    <CardHeader>
      <div className="flex justify-between items-start">
        <Skeleton className="h-12 w-12 rounded-lg bg-gray-700" />
        <Skeleton className="h-6 w-24 rounded-full bg-gray-700" />
      </div>
      <Skeleton className="h-6 w-3/4 mt-4 bg-gray-700" />
      <Skeleton className="h-4 w-full mt-2 bg-gray-700" />
      <Skeleton className="h-4 w-3/4 mt-1 bg-gray-700" />
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter className="flex justify-between items-center border-t border-gray-800/50 pt-4">
      <Skeleton className="h-10 w-24 bg-gray-700" />
      <Skeleton className="h-10 w-10 bg-gray-700" />
    </CardFooter>
  </Card>
);

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        setServices(data.services);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching services:", error);
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden relative pt-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Available Services
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore our collection of powerful APIs and integrate them into your
            workflows to supercharge your applications.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <ServiceSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className="bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm flex flex-col hover:border-purple-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-purple-400" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-400 border-purple-500/30"
                    >
                      {service.pricing.amount} {service.pricing.currency}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                  <div className="text-sm text-gray-500">
                    <p>
                      Provider:{" "}
                      <span className="text-purple-400">
                        {service.provider}
                      </span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-800/50 pt-4 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {service.inputs && service.inputs.length > 0
                      ? `${service.inputs.length} input field${
                          service.inputs.length > 1 ? "s" : ""
                        }`
                      : "No input required"}
                  </div>
                  <Link href={`/chat/${service.id}`} passHref>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:cursor-pointer">
                      Try It <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
