import { NextRequest, NextResponse } from 'next/server';
import { WALLET_COOKIE_NAME } from '@/lib/sessionWalletManager';

// Cookie expiration in days

// Cookie expiration in days
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Session Wallet interface
 */
interface SessionWallet {
  id: string;
  address: string;
  network: string;
  createdAt: number;
}

/**
 * POST handler for /api/wallet-session
 * 
 * Sets a secure HTTP-only cookie with wallet information
 * 
 * @param req The request object
 * @returns Response with success status
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { wallet, action } = body;
    
    if (action === 'save' && wallet) {
      // Validate wallet data
      if (!wallet.id || !wallet.address || !wallet.network) {
        return NextResponse.json(
          { error: 'Invalid wallet data' },
          { status: 400 }
        );
      }
      
      // Create wallet session data
      const sessionWallet: SessionWallet = {
        id: wallet.id,
        address: wallet.address,
        network: wallet.network,
        createdAt: wallet.createdAt || Date.now()
      };
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
      
      // Set the cookie in the response
      const response = NextResponse.json({
        success: true,
        message: 'Wallet saved to session'
      });
      
      // Set cookie in the response
      response.cookies.set({
        name: WALLET_COOKIE_NAME,
        value: JSON.stringify(sessionWallet),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiryDate
      });
      
      return response;
    } else if (action === 'delete') {
      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'Wallet removed from session'
      });
      
      // Delete the cookie from response
      response.cookies.delete(WALLET_COOKIE_NAME);
      
      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing wallet session:', error);
    return NextResponse.json(
      { error: 'Failed to process wallet session' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for /api/wallet-session
 * 
 * Retrieves wallet information from the session cookie
 * 
 * @returns Response with wallet data or null
 */
export async function GET(req: NextRequest) {
  try {
    // Get the wallet cookie from the request
    const walletCookie = req.cookies.get(WALLET_COOKIE_NAME);
    
    if (!walletCookie) {
      return NextResponse.json({
        success: true,
        wallet: null
      });
    }
    
    try {
      // Parse the cookie value
      const wallet = JSON.parse(walletCookie.value) as SessionWallet;
      
      return NextResponse.json({
        success: true,
        wallet
      });
    } catch (parseError) {
      console.error('Error parsing wallet cookie:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet data in session',
        wallet: null
      });
    }
  } catch (error) {
    console.error('Error retrieving wallet session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wallet session' },
      { status: 500 }
    );
  }
}
