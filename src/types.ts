// Type definitions for the Flow application

export interface InputField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  className?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  payoutAddress: string;
  provider: string;
  pricing: {
    amount: string;
    currency: string;
    network?: string;
  };
  inputs: InputField[];
  creator?: string;
  tags?: string[];
  example?: string;
}

export interface PaymentData {
  [key: string]: unknown; 
  x402Version: number;
  error?: string;
  accepts: {
    [currency: string]: {
      [network: string]: string; 
    };
  };
  requests: {
    [currency: string]: {
      [network: string]: string;
    };
  };
  info: {
    [key: string]: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: string;
  paymentData?: PaymentData;
  imageUrl?: string;
  isStoring?: boolean;
  ipfsUrl?: string;
  storeError?: string;
}

export interface AgentResponseData {
  [key: string]: unknown;
}
