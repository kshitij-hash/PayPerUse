import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';

/**
 * POST handler for /api/get-balances
 * Fetches token balances for a given wallet address on a specified network
 * 
 * Request body must include:
 * - address: Wallet address to fetch balances for
 * - network: Network to fetch balances from (e.g., "base-sepolia")
 * 
 * Environment variables required:
 * - CDP_API_KEY_ID: Coinbase Developer Platform API Key ID
 * - CDP_API_KEY_SECRET: Coinbase Developer Platform API Key Secret
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { address, network } = body;
    
    // Validate required parameters
    if (!address || !network) {
      return NextResponse.json(
        { error: 'Missing required parameters: address and network' },
        { status: 400 }
      );
    }
    
    // Check for required environment variables
    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Missing required CDP API credentials' },
        { status: 400 }
      );
    }
    
    // Initialize the CDP client with provided credentials
    const cdp = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });
    
    // Fetch token balances
    const tokenBalances = await cdp.evm.listTokenBalances({
      address: address,
      network: network,
    });
    
    // Convert BigInt values to strings before serializing
    const serializedBalances = JSON.parse(JSON.stringify(tokenBalances, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    // Return the token balances with serialized BigInt values
    return NextResponse.json({
      success: true,
      balances: serializedBalances
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balances', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
