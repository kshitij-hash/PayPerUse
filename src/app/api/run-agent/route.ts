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
    const account = privateKey 
      ? privateKeyToAccount(`0x${privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey}`)
      : privateKeyToAccount('0x1111111111111111111111111111111111111111111111111111111111111111'); // Demo key for testing

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
      const api = withPaymentInterceptor(
        axios.create({
          baseURL: service.endpoint,
        }),
        account
      );

      // Make the request to the service with the current input and step config
      const response = await api.post('/', {
        input: currentInput,
        config: step.config
      });

      // Store the result
      stepResults.push({
        stepId: step.id,
        serviceId: step.serviceId,
        serviceName: service.name,
        result: response.data
      });

      // Use this step's output as the input for the next step
      currentInput = response.data.output || response.data;
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
