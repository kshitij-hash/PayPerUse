import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';
import axios from 'axios';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import { LocalAccount } from 'viem';
import { toAccount } from 'viem/accounts';

// Initialize CDP client with server-side environment variables
const cdpClient = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY_ID as string,
  apiKeySecret: process.env.CDP_API_KEY_SECRET as string,
  walletSecret: process.env.CDP_WALLET_SECRET as string,
});

/**
 * Server-side proxy for x402 paid API calls
 * This handles the CDP authentication and x402 payment flow on the server
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { walletId, endpoint, method, data, walletAddress } = await request.json();
    
    if (!walletId || !endpoint || !method) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`x402-proxy - Starting API call to ${endpoint} with wallet ${walletId}`);
    
    // Get the wallet account from CDP
    let serverAccount;
    try {
      serverAccount = await cdpClient.evm.getAccount({
        name: walletId,
        address: walletAddress as `0x${string}` | undefined,
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('x402-proxy - Error getting wallet:', err);
      return NextResponse.json(
        { error: `Wallet not found: ${walletId}` },
        { status: 404 }
      );
    }

    // Convert to viem account format
    const account = toAccount<LocalAccount>(serverAccount as unknown as LocalAccount);
    
    // Create axios instance with payment interceptor
    const axiosInstance = axios.create({ 
      baseURL: process.env.VERCEL_URL || 'https://flow-nu-two.vercel.app' 
    });
    
    // Add a custom interceptor to convert payment header names to uppercase
    axiosInstance.interceptors.request.use(config => {
      // Check if headers exist
      if (config.headers) {
        const headers = config.headers as Record<string, string>;
        
        // Look for lowercase payment headers and convert them to uppercase
        const paymentHeaders = ['x-payment', 'x-payment-signature', 'x-payment-timestamp', 'x-payment-address'];
        
        for (const header of paymentHeaders) {
          if (headers[header]) {
            // Convert to uppercase and set the new header
            const upperCaseHeader = header.toUpperCase();
            headers[upperCaseHeader] = headers[header];
            
            // Remove the lowercase header
            delete headers[header];
            
            console.log(`x402-proxy - Converted header ${header} to ${upperCaseHeader}`);
          }
        }
        
        // Simplified logging
        if (headers['X-PAYMENT']) {
          console.log('x402-proxy - X-PAYMENT header is present after conversion');
        }
      }
      
      return config;
    });
    
    // Create a custom axios interceptor to log 402 responses
    axiosInstance.interceptors.response.use(
      response => response,
      async (error) => {
        if (error.response && error.response.status === 402) {
          console.log('x402-proxy - Received 402 response');
        }
        return Promise.reject(error);
      }
    );
    
    // Create client with payment interceptor
    const client = withPaymentInterceptor(
      axiosInstance,
      account
    );
    
    // Make the API call with the payment interceptor
    let response;
    try {
      if (method === 'GET') {
        response = await client.get(endpoint, { params: data });
      } else if (method === 'POST') {
        response = await client.post(endpoint, data);
      } else if (method === 'PUT') {
        response = await client.put(endpoint, data);
      } else if (method === 'DELETE') {
        response = await client.delete(endpoint, { data });
      } else {
        return NextResponse.json(
          { error: `Unsupported method: ${method}` },
          { status: 400 }
        );
      }
      
      console.log(`x402-proxy - Successful response from ${endpoint}`);
      
      // Log all response headers to see what's available
      console.log('x402-proxy - Response headers:', response.headers);
      
      // Check if we have payment response information
      // Try both lowercase and uppercase header names
      const paymentResponseHeader = response.headers['x-payment-response'] || 
                                  response.headers['X-PAYMENT-RESPONSE'];
      
      console.log('x402-proxy - Payment response header present:', !!paymentResponseHeader);
      
      if (paymentResponseHeader) {
        try {
          console.log('x402-proxy - Raw payment response header:', paymentResponseHeader);
          
          // Handle both JSON string and base64-encoded formats
          let paymentResponse;
          try {
            // First try to parse as JSON string
            paymentResponse = typeof paymentResponseHeader === 'string' 
              ? JSON.parse(paymentResponseHeader)
              : paymentResponseHeader;
          } catch {
            // If that fails, try to decode as base64
            console.log('x402-proxy - Failed to parse as JSON, trying base64 decode');
            paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
          }
          
          console.log('x402-proxy - Payment confirmed:', paymentResponse);
          
          // Add payment information to the response
          return NextResponse.json({
            ...response.data,
            _paymentInfo: {
              transaction: paymentResponse.transaction,
              success: paymentResponse.success,
              network: paymentResponse.network,
              payer: paymentResponse.payer
            }
          });
        } catch (error: unknown) {
          console.log('x402-proxy - Failed to decode payment response:', error);
        }
      }
      
      return NextResponse.json(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: unknown }; message: string };
      // If we get a 402 Payment Required, pass it through to the client
      if (err.response?.status === 402) {
        console.log('x402-proxy - Received 402 Payment Required');
        
        // Return the 402 response with payment details
        return NextResponse.json(
          err.response.data,
          { status: 402 }
        );
      }
      
      // For other errors, return appropriate error response
      console.error(`x402-proxy - Error calling ${endpoint}:`, err.message);
      return NextResponse.json(
        { error: `API call failed: ${err.message}` },
        { status: err.response?.status || 500 }
      );
    }
    
    console.log(`x402-proxy - Successful response from ${endpoint}`);
    
    // Return the response data
    return NextResponse.json(response.data);
  } catch (error) {
    const err = error as { response?: { status: number; data: unknown }; message: string };
    console.error('x402-proxy - Error:', error);
    
    // Provide more detailed error information
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
      
      return NextResponse.json(
        { error: `API call failed with status ${err.response.status}`, details: err.response.data },
        { status: err.response.status }
      );
    }
    
    return NextResponse.json(
      { error: `API call failed: ${err.message}` },
      { status: 500 }
    );
  }
}
