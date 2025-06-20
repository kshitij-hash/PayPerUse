"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Import next/image
import { Footer } from "@/components/footer";
import { useCdpWallet } from "@/context/CdpWalletContext";
import { Header } from "@/components/Header";

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

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
}

interface ImageApiResponse {
  result: string;
}

// Service Modal Component
function ServiceModal({ service, onClose }: ServiceModalProps) {
  // State for form inputs and results
  type FormInputValue = string | number | boolean | string[];
  interface FormInputs {
    [key: string]: FormInputValue;
  }
  const [formInputs, setFormInputs] = useState<FormInputs>({});
  const [result, setResult] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null); // Added for image display
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { wallet, callPaidApiWithWallet } = useCdpWallet();

  // Initialize form inputs with default values when service changes
  useEffect(() => {
    if (service?.inputs) {
      const initialInputs: FormInputs = {};
      service.inputs.forEach((input) => {
        initialInputs[input.name] = input.defaultValue || "";
      });
      setFormInputs(initialInputs);
    } else {
      setFormInputs({ input: "" });
    }
    setResult(null); // Reset previous results
    setImageBase64(null); // Reset previous image
    setError(null); // Reset previous errors
  }, [service]);

  // Handle input changes
  const handleInputChange = (name: string, value: string) => {
    setFormInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    if (!wallet) {
      setError("No wallet connected. Please connect a wallet first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageBase64(null); // Reset image on new submission

    try {
      // Process form data based on input types
      const payload = { ...formInputs };

      // Special handling for certain input types
      if (service.inputs) {
        service.inputs.forEach((input) => {
          // Handle comma-separated keywords
          if (
            input.name === "keywords" &&
            typeof payload.keywords === "string"
          ) {
            payload.keywords = payload.keywords.trim()
              ? payload.keywords.split(",").map((k: string) => k.trim())
              : [];
          }
        });
      }

      // Call the service API using the wallet context
      const apiResponse = await callPaidApiWithWallet(
        service.endpoint,
        "POST",
        payload
      );

      if (apiResponse == null) {
        // Checks for both null and undefined
        setError(
          "Failed to get a response from the service. The response was null or undefined."
        );
        setResult(null);
        setImageBase64(null); // Clear image if the response is null
        // Consider setting loading state to false here if applicable, e.g., setLoading(false);
      } else if (service.id === "generate-image") {
        if (typeof apiResponse === "object" && apiResponse !== null) {
          if (
            "result" in apiResponse &&
            typeof (apiResponse as { result: unknown }).result === "string"
          ) {
            setImageBase64((apiResponse as ImageApiResponse).result); // apiResponse is the full data URI
            setResult(null); // Don't show raw data URI in the JSON result area
          } else {
            setError(
              "Image generator response is missing 'result' string property."
            );
            setResult(JSON.stringify(apiResponse, null, 2)); // Show the problematic response
            setImageBase64(null);
          }
        } else {
          setError(
            "Image generator returned an unexpected response. Expected a data URI string (e.g., data:image/jpeg;base64,...)."
          );
          // Show what was received if it's not the expected format
          setResult(
            typeof apiResponse === "object"
              ? JSON.stringify(apiResponse, null, 2)
              : String(apiResponse)
          );
          setImageBase64(null);
        }
      } else {
        setResult(JSON.stringify(apiResponse, null, 2));
        setImageBase64(null); // Ensure image is cleared for non-image services
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to call service");
    } finally {
      setIsLoading(false);
    }
  };

  // Render a form field based on its type
  const renderFormField = (input: InputField) => {
    const {
      name,
      label,
      type,
      placeholder,
      required,
      options,
      rows,
      className,
    } = input;

    switch (type) {
      case "text":
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2">{label}:</label>
            <input
              type="text"
              value={
                typeof formInputs[name] === "boolean"
                  ? String(formInputs[name])
                  : formInputs[name] || ""
              }
              onChange={(e) => handleInputChange(name, e.target.value)}
              className={`w-full p-3 bg-gray-700 border border-gray-600 rounded text-white ${
                className || ""
              }`}
              placeholder={placeholder}
              required={required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2">{label}:</label>
            <textarea
              value={
                typeof formInputs[name] === "boolean"
                  ? String(formInputs[name])
                  : formInputs[name] || ""
              }
              onChange={(e) => handleInputChange(name, e.target.value)}
              className={`w-full p-3 bg-gray-700 border border-gray-600 rounded text-white ${
                className || ""
              }`}
              rows={rows || 4}
              placeholder={placeholder}
              required={required}
            />
          </div>
        );

      case "select":
        return (
          <div key={name} className="mb-4">
            <label className="block mb-2">{label}:</label>
            <select
              value={
                typeof formInputs[name] === "boolean"
                  ? String(formInputs[name])
                  : formInputs[name] || ""
              }
              onChange={(e) => handleInputChange(name, e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
              required={required}
            >
              {options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900/90 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm border border-gray-800/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{service.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300">{service.description}</p>
          <div className="mt-2 text-sm text-gray-400">
            <p>Endpoint: {service.endpoint}</p>
            <p>
              Price: {service.pricing.amount} {service.pricing.currency}
            </p>
          </div>
        </div>

        {!wallet ? (
          <div className="bg-yellow-800 text-yellow-200 p-4 rounded mb-4">
            <p>You need to connect a wallet before using this service.</p>
            <Link href="/wallet" className="underline mt-2 inline-block">
              Go to Wallet Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Render dynamic form fields if service has inputs defined */}
            {service.inputs ? (
              service.inputs.map((input) => renderFormField(input))
            ) : (
              // Fallback for services without defined inputs
              <div>
                <label className="block mb-2">Input:</label>
                <textarea
                  value={
                    typeof formInputs.input === "boolean"
                      ? String(formInputs.input)
                      : formInputs.input || ""
                  }
                  onChange={(e) => handleInputChange("input", e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                  rows={4}
                  placeholder="Enter your input for the service..."
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Call Service"}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Conditional rendering for image or text result */}
        {service.id === "generate-image" && imageBase64 ? (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Generated Image:</h3>
            <div className="relative w-full max-w-md mx-auto aspect-square border border-gray-700 rounded overflow-hidden">
              <Image
                src={imageBase64} // imageBase64 now holds the full data URI
                alt="Generated image"
                layout="fill"
                objectFit="contain"
              />
            </div>
          </div>
        ) : (
          result && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Result:</h3>
              <div className="p-3 bg-gray-700 rounded overflow-x-auto">
                <pre className="text-green-300 whitespace-pre-wrap">
                  {result}
                </pre>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { wallet } = useCdpWallet();

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Services</h1>
          <p className="text-gray-400">
            Explore our collection of paid APIs that you can use in your
            workflows
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-gray-900/80 rounded-xl p-6 border border-gray-800/50 flex flex-col backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                    {service.pricing.amount} {service.pricing.currency}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                <p className="text-gray-400 mb-4 flex-grow">
                  {service.description}
                </p>
                <div className="border-t border-gray-700 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Provider:</span>
                    <span className="text-sm font-medium">
                      {service.provider}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Endpoint:</span>
                    <span className="text-sm font-medium text-blue-400">
                      {service.endpoint}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Service ID:</span>
                    <span className="text-sm font-medium">{service.id}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                      disabled={!wallet}
                    >
                      {!wallet ? "Connect Wallet" : "Use Service"}
                    </button>
                    
                    <Link 
                      href={`/chat/${service.id}`}
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Service Modal */}
      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      <Footer />
    </div>
  );
}
