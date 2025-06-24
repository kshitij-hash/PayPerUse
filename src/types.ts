// Type definitions for the Flow application

export interface InputField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  rows?: number;
  className?: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  pricing: {
    amount: string;
    currency: string;
    network?: string;
  };
  payoutAddress: string;
  provider: string;
  inputs: InputField[];
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: string;
  paymentData?: PaymentData;
  imageUrl?: string;
  ipfsHash?: string;
  isStoring?: boolean;
  storeError?: string;
}

export interface PaymentData {
  [key: string]: unknown; 
  x402Version: number;
  error?: string;
  accepts: {
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    mimeType: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: {
      name: string;
      version: string;
    };
  }[];
}
