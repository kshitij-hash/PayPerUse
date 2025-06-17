import { NextRequest, NextResponse } from 'next/server';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * POST handler for /api/pay-and-call
 * Handles X402 payment signing and makes HTTP calls to paid endpoints
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method = 'GET', data, headers = {}, privateKey } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Create a wallet account from the provided private key or use a default test key
    // In production, you should never hardcode private keys and use secure key management
    const account = privateKey 
      ? privateKeyToAccount(`0x${privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey}`)
      : privateKeyToAccount('0x1111111111111111111111111111111111111111111111111111111111111111'); // Demo key for testing

    // Create an Axios instance with payment handling
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: new URL(url).origin,
        headers
      }),
      account
    );

    // Make the request with X402 payment handling
    const response = await api.request({
      url: new URL(url).pathname + new URL(url).search,
      method,
      data: method !== 'GET' && method !== 'HEAD' ? data : undefined,
    });

    // Extract payment response if available
    let paymentResponse = null;
    if (response.headers['x-payment-response']) {
      paymentResponse = decodeXPaymentResponse(response.headers['x-payment-response']);
    }

    // Return the response data and payment details
    return NextResponse.json({
      success: true,
      data: response.data,
      payment: paymentResponse,
      headers: response.headers
    }, { status: response.status });
  } catch (error: unknown) {
    console.error('Error in pay-and-call:', error);
    
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
        error: 'Failed to make paid request', 
        details: errorMessage,
        response: errorData
      },
      { status: errorStatus }
    );
  }
}
