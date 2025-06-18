import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { privateKeyToAccount } from 'viem/accounts';

interface AgentStep {
  id: string;
  serviceId: string;
  config: Record<string, unknown>;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  steps: AgentStep[];
  pricing: {
    amount: string;
    currency: string;
  };
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
  provider: string;
}

/**
 * POST handler for /api/run-agent
 * Accepts agent ID or config + input, executes each step in the workflow
 */
export async function POST(request: NextRequest) {
  try {
    // We no longer need to extract the payment header directly
    // as we're using the x402-proxy for payment handling
    
    const body = await request.json();
    const { agentId, input, config = {}, privateKey } = body;

    if (!agentId && !config) {
      return NextResponse.json(
        { error: 'Either agentId or agent config is required' },
        { status: 400 }
      );
    }

    // Load agents and services data
    const agentsPath = path.join(process.cwd(), 'agents.json');
    const servicesPath = path.join(process.cwd(), 'services.json');
    
    const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    
    // Find the requested agent by ID or use provided config
    let agent: Agent;
    if (agentId) {
      agent = agentsData.agents.find((a: Agent) => a.id === agentId);
      if (!agent) {
        return NextResponse.json(
          { error: `Agent with ID ${agentId} not found` },
          { status: 404 }
        );
      }
    } else {
      // Use provided config as the agent definition
      agent = config as Agent;
    }

    // Create a wallet account from the provided private key or use a default test key
    // In production, you should never hardcode private keys and use secure key management
    let account;
    try {
      if (privateKey) {
        // Check if privateKey is a valid hex string
        const hexRegex = /^(0x)?[0-9a-fA-F]+$/;
        if (hexRegex.test(privateKey)) {
          // It's a valid hex string, use it as a private key
          const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
          account = privateKeyToAccount(formattedKey);
        } else {
          // It's not a valid hex string (likely a wallet ID), use a demo key
          console.log('Using demo key for wallet ID:', privateKey);
          account = privateKeyToAccount('0x1111111111111111111111111111111111111111111111111111111111111111');
        }
      } else {
        // No key provided, use demo key
        account = privateKeyToAccount('0x1111111111111111111111111111111111111111111111111111111111111111');
      }
    } catch (keyError) {
      console.error('Error creating account from private key:', keyError);
      // Fallback to demo key
      account = privateKeyToAccount('0x1111111111111111111111111111111111111111111111111111111111111111');
    }

    // Execute each step in the agent workflow
    const stepResults = [];
    let currentInput = input;

    for (const step of agent.steps) {
      // Find the service for this step
      const service = servicesData.services.find((s: Service) => s.id === step.serviceId);
      
      if (!service) {
        return NextResponse.json(
          { error: `Service with ID ${step.serviceId} not found` },
          { status: 404 }
        );
      }

      // Create an Axios instance with payment handling for this service
      // Determine if the endpoint is relative or absolute
      const isRelativeEndpoint = service.endpoint.startsWith('/');
      
      let baseURL: string;
      let requestPath: string;
      
      if (isRelativeEndpoint) {
        // For relative endpoints, use the app URL as base and the endpoint as path
        baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Default to localhost if env var not set
        requestPath = service.endpoint;
      } else {
        // For absolute endpoints, use the endpoint as base and '/' as path
        baseURL = service.endpoint;
        requestPath = '/';
      }
      
      try {
        let response;
        
        if (isRelativeEndpoint) {
          // For internal endpoints, use the x402-proxy to handle payment automatically
          // This will handle 402 responses and make payments as needed
          console.log(`Using x402-proxy for internal endpoint: ${service.endpoint}`);
          
          // Create a fetch request to the x402-proxy endpoint
          const proxyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/x402-proxy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletId: privateKey ? 'custom-wallet' : 'default-wallet',  // Use appropriate wallet ID
              endpoint: service.endpoint,  // The internal endpoint we want to call
              method: 'POST',
              data: {  // The data to send to the endpoint
                input: currentInput,
                config: step.config
              },
              walletAddress: account.address  // Pass the wallet address if available
            }),
          });
          
          if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json();
            throw new Error(`API call failed with status ${proxyResponse.status}: ${JSON.stringify(errorData)}`);
          }
          
          response = { data: await proxyResponse.json() };
        } else {
          // For external endpoints, use the payment interceptor as before
          const api = withPaymentInterceptor(
            axios.create({
              baseURL,
            }),
            account
          );
          
          // Make the request
          response = await api.post(requestPath, {
            input: currentInput,
            config: step.config
          });
        }
        
        // Store the result
        stepResults.push({
          stepId: step.id,
          serviceId: step.serviceId,
          serviceName: service.name,
          result: response.data
        });
        
        // Update the input for the next step
        currentInput = response.data.output || response.data;
        
      } catch (error) {
        console.error(`Error executing step ${step.id} with service ${service.id}:`, error);
        return NextResponse.json(
          { error: `Failed to execute step ${step.id}`, details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // Return the final result and all step results
    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
      input,
      output: currentInput,
      steps: stepResults
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error executing agent:', error);
    
    // Handle X402 specific errors
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 
        'headers' in error.response && error.response.headers && 
        typeof error.response.headers === 'object' && 
        'x-payment-required' in error.response.headers) {
      return NextResponse.json(
        { 
          error: 'Payment required',
          paymentDetails: error.response.headers['x-payment-required']
        },
        { status: 402 }
      );
    }
    
    // Extract error details safely
    const errorMessage = error && typeof error === 'object' && 'message' in error ? 
      error.message as string : String(error);
    
    const errorResponse = error && typeof error === 'object' && 'response' in error && 
      error.response && typeof error.response === 'object' ? error.response : null;
    
    const errorStatus = errorResponse && 'status' in errorResponse ? 
      errorResponse.status as number : 500;
    
    const errorData = errorResponse && 'data' in errorResponse ? 
      errorResponse.data : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to execute agent', 
        details: errorMessage,
        response: errorData
      },
      { status: errorStatus }
    );
  }
}
