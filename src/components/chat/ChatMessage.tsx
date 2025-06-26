"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, AlertTriangle, Info, Check, Copy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

import { ChatMessage as ChatMessageType } from "../../types";
import { Dispatch, SetStateAction } from "react";

interface ChatMessageProps extends ChatMessageType {
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  setMessages,
  role,
  content,
  timestamp,
  paymentData,
}) => {
  const [copied, setCopied] = useState(false);
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const formattedTime = format(new Date(timestamp), "h:mm a");

  // Parse the content and extract result, collection details, NFT data, and step information
  const [displayContent, collectionDetails, nftData, step] = (() => {
    try {
      if (
        typeof content === "string" &&
        content.trim().startsWith('{"result":')
      ) {
        const parsedContent = JSON.parse(content);
        if (parsedContent.result) {
          return [
            parsedContent.result.replace(/\\n/g, "\n"),
            parsedContent.collectionDetails,
            parsedContent.nftData,
            parsedContent.step || 0,
            parsedContent.nextStep,
          ];
        }
      }
    } catch (e) {
      console.error("Error parsing message content:", e);
    }
    return [content, undefined, undefined, 0, undefined];
  })();

  // State for handling the step-wise NFT generation process
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [imageIpfsHash, setImageIpfsHash] = useState<string | null>(null);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(step);
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  // Upload image to IPFS (Step 2)
  const uploadToIpfs = async () => {
    setProcessingStep("upload-to-ipfs");
    setIsUploading(true);
    try {
      const response = await fetch("/api/nft-minting-agent/upload-to-ipfs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: displayContent,
          collectionDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload to IPFS");
      }

      const data = await response.json();
      setIpfsUrl(data.imageUri);
      setImageIpfsHash(data.imageIpfsHash);
      setCurrentStep(data.step);

      const successMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "assistant",
        content: JSON.stringify({
          result: `Image uploaded to IPFS successfully.`,
          collectionDetails,
          step: data.step,
          nextStep: data.nextStep,
          nftData: {
            imageUri: data.imageUri,
            imageIpfsHash: data.imageIpfsHash,
          },
        }),
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, successMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      alert(`Error uploading to IPFS: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setProcessingStep(null);
    }
  };

  // Create and upload metadata to IPFS (Step 3)
  const createMetadata = async () => {
    setProcessingStep("create-metadata");
    setIsUploading(true);
    try {
      const response = await fetch("/api/nft-minting-agent/create-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUri: ipfsUrl || nftData?.imageUri,
          collectionDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create metadata");
      }

      const data = await response.json();
      setMetadataUri(data.metadataUri);
      setCurrentStep(data.step);

      const successMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "assistant",
        content: JSON.stringify({
          result: `NFT metadata created and uploaded to IPFS successfully.`,
          collectionDetails,
          step: data.step,
          nextStep: data.nextStep,
          nftData: {
            imageUri: ipfsUrl || nftData?.imageUri,
            imageIpfsHash: imageIpfsHash || nftData?.imageIpfsHash,
            metadataUri: data.metadataUri,
            metadataIpfsHash: data.metadataIpfsHash,
          },
        }),
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, successMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      alert(`Error creating metadata: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setProcessingStep(null);
    }
  };
  if (
    displayContent.startsWith("data:image/jpeg;base64,") ||
    displayContent.startsWith("data:image/png;base64,")
  ) {
    return (
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <Bot className="h-6 w-6 text-purple-400" />
          </div>
        </div>
        <div className="flex-1 pt-2 max-w-3xl">
          <div className="bg-black/40 border-l-4 border-l-purple-500 border-t border-r border-b border-gray-800/50 rounded-md p-4 shadow-lg">
            {/* NFT Collection Details */}
            {collectionDetails && (
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-md">
                <h3 className="text-lg font-bold text-purple-300 mb-2">
                  {collectionDetails.collectionName || "NFT Collection"}
                </h3>
                {collectionDetails.nftName && (
                  <h4 className="text-md font-medium text-purple-200 mb-1">
                    {collectionDetails.nftName}
                  </h4>
                )}
                {collectionDetails.description && (
                  <p className="text-sm text-gray-300">
                    {collectionDetails.description}
                  </p>
                )}

                {/* NFT Metadata Links - Show when available */}
                {nftData && (
                  <div className="mt-3 pt-3 border-t border-purple-500/30">
                    <h4 className="text-sm font-medium text-purple-200 mb-1">
                      NFT Details
                    </h4>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <a
                        href={nftData.imageUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 py-1 px-2 rounded flex items-center justify-between"
                      >
                        <span>View Image on IPFS</span>
                        <span className="text-purple-400">→</span>
                      </a>
                      <a
                        href={nftData.metadataUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 py-1 px-2 rounded flex items-center justify-between"
                      >
                        <span>View Metadata</span>
                        <span className="text-indigo-400">→</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NFT Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayContent}
              alt={collectionDetails?.nftName || "Generated NFT Image"}
              className="max-w-full h-auto rounded-md border border-purple-500/30"
            />

            {/* Step-wise NFT generation process UI */}
            <div className="mt-4">
              {/* Step indicator */}
              <div className="mb-3 flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    currentStep >= 1 ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <div
                  className={`h-0.5 w-4 ${
                    currentStep >= 2 ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <div
                  className={`h-2 w-2 rounded-full ${
                    currentStep >= 2 ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <div
                  className={`h-0.5 w-4 ${
                    currentStep >= 3 ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <div
                  className={`h-2 w-2 rounded-full ${
                    currentStep >= 3 ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-xs text-gray-400 ml-2">
                  {currentStep === 1 && "Step 1: Image Generated"}
                  {currentStep === 2 && "Step 2: Uploaded to IPFS"}
                  {currentStep === 3 && "Step 3: Metadata Created"}
                </span>
              </div>

              {/* Step 1 is complete when we have an image */}

              {/* Step 2: Upload to IPFS button - show if we're at step 1 */}
              {currentStep === 1 && !nftData?.imageUri && (
                <Button
                  onClick={uploadToIpfs}
                  disabled={isUploading || processingStep === "upload-to-ipfs"}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  {processingStep === "upload-to-ipfs"
                    ? "Uploading to IPFS..."
                    : "Upload to IPFS"}
                </Button>
              )}

              {/* Step 3: Create Metadata button - show if we're at step 2 */}
              {(currentStep === 2 ||
                (nftData?.imageUri && !nftData?.metadataUri)) && (
                <Button
                  onClick={createMetadata}
                  disabled={isUploading || processingStep === "create-metadata"}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mt-2"
                >
                  {processingStep === "create-metadata"
                    ? "Creating Metadata..."
                    : "Create NFT Metadata"}
                </Button>
              )}

              {/* Success messages for each step */}
              {ipfsUrl && currentStep >= 2 && !nftData?.imageUri && (
                <div className="mt-2 text-sm text-green-400">
                  <p>Successfully uploaded image to IPFS!</p>
                  <a
                    href={ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View on IPFS
                  </a>
                </div>
              )}

              {metadataUri && currentStep >= 3 && !nftData?.metadataUri && (
                <div className="mt-2 text-sm text-green-400">
                  <p>Successfully created NFT metadata!</p>
                  <a
                    href={metadataUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View Metadata
                  </a>
                </div>
              )}

              {/* If we have complete NFT data from the response, show that instead */}
              {nftData && nftData.metadataUri && (
                <div className="mt-2 text-sm text-green-400">
                  <p>NFT creation complete!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(displayContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const getAvatar = () => {
    switch (role) {
      case "user":
        return (
          <Avatar className="h-10 w-10 border-2 border-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
            />
            <AvatarFallback className="text-white font-bold bg-transparent">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        );
      case "assistant":
        return (
          <div className="h-10 w-10 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
            <Bot className="h-6 w-6 text-purple-400" />
          </div>
        );
      case "system":
        return (
          <div className="h-10 w-10 bg-gray-600/20 border border-gray-500/30 rounded-lg flex items-center justify-center">
            <Info className="h-6 w-6 text-gray-400" />
          </div>
        );
      case "error":
        return (
          <div className="h-10 w-10 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        );
    }
  };

  const cardStyles = {
    user: "bg-gradient-to-br from-purple-600/80 to-pink-600/70 border text-white border-purple-500/30 shadow-lg hover:shadow-purple-900/20 transition-all duration-300",
    assistant:
      "bg-gradient-to-br from-gray-900/80 via-purple-950/50 to-gray-900/80 text-white border-l-4 border-l-purple-500 border-t border-r border-b border-gray-800/50 shadow-lg hover:shadow-purple-900/10 transition-all duration-300",
    system:
      "bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border text-white border-blue-800/50 shadow-md",
    error:
      "bg-gradient-to-r from-red-900/30 to-orange-900/20 border text-red-500 border-red-800/50 shadow-md",
  };

  return (
    <div
      className={`flex items-start space-x-4 ${
        role === "user" ? "justify-end" : ""
      } mb-6`}
    >
      {role !== "user" && <div className="flex-shrink-0">{getAvatar()}</div>}

      <div
        className={`flex-1 max-w-3xl ${role === "user" ? "text-right" : ""}`}
      >
        <Card className={`relative shadow-sm border ${cardStyles[role]}`}>
          {role === "assistant" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="absolute top-2 right-2 h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          <CardContent
            className={`px-4 py-0 text-left ${role === "assistant" ? "" : ""} ${
              role === "user" ? "" : ""
            }`}
          >
            <div className="prose prose-invert max-w-none prose-p:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white prose-h5:text-white prose-h6:text-white prose-strong:text-purple-300 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-pink-400 hover:prose-a:underline prose-blockquote:text-gray-300 prose-blockquote:border-purple-500 prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:italic">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (props) => (
                    <h1
                      className="text-xl font-bold text-white mt-4 mb-2"
                      {...props}
                    />
                  ),
                  h2: (props) => (
                    <h2
                      className="text-lg font-bold text-white mt-3 mb-2"
                      {...props}
                    />
                  ),
                  h3: (props) => (
                    <h3
                      className="text-md font-bold text-white mt-2 mb-1"
                      {...props}
                    />
                  ),
                  h4: (props) => (
                    <h4
                      className="text-base font-bold text-white mt-2 mb-1"
                      {...props}
                    />
                  ),
                  p: (props) => <p className="text-white" {...props} />,
                  strong: (props) => (
                    <strong className="font-bold text-purple-300" {...props} />
                  ),
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className="bg-gradient-to-r from-purple-900/40 to-pink-900/30 text-purple-200 px-1.5 py-0.5 rounded-md border border-purple-500/30 shadow-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>

            {paymentData && (
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-600/50 rounded-md backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-orange-900/20">
                <h4 className="font-medium text-yellow-300 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Payment Required
                </h4>
                <p className="text-sm text-yellow-400 mt-1">
                  This service requires payment to continue.
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                    onClick={() =>
                      console.log("Payment flow triggered", paymentData)
                    }
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div
          className={`text-xs text-gray-500 mt-1.5 px-2 ${
            role === "user" ? "text-right" : "text-left"
          } opacity-70 transition-opacity duration-300 hover:opacity-100`}
        >
          {formattedTime}
        </div>
      </div>

      {role === "user" && <div className="flex-shrink-0">{getAvatar()}</div>}
    </div>
  );
};

export default ChatMessage;
