/**
 * Simplified client for making paid API calls via the server-side proxy
 * This avoids JWT encoding issues in the browser by delegating CDP authentication to the server
 */

/**
 * Make a call to a paid API endpoint using the server-side x402 proxy
 * @param walletId The wallet ID to use for payment
 * @param endpoint The API endpoint to call (e.g., '/api/summarize')
 * @param method The HTTP method to use
 * @param data The request data
 * @param walletAddress Optional wallet address if already known
 * @returns The API response data
 */
export async function callPaidApi<T>(
  walletId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: Record<string, unknown>,
  walletAddress?: string
): Promise<T> {
  try {
    console.log(`callPaidApi - Starting API call to ${endpoint} with wallet ${walletId}`);
    
    // Call the server-side proxy endpoint
    const response = await fetch('/api/x402-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletId,
        endpoint,
        method,
        data,
        walletAddress,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API call failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    console.log(`callPaidApi - Successful response from ${endpoint}`);
    return result as T;
  } catch (error) {
    console.error(`callPaidApi - Error calling ${endpoint}:`, error);
    throw new Error(`API call to ${endpoint} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
