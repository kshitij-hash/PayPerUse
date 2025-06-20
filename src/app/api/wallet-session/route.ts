import { NextRequest, NextResponse } from 'next/server';
import { 
  WALLET_COOKIE_NAME, 
  saveWalletToDatabase,
  getWalletFromDatabase,
  removeWalletFromDatabase,
  getUserIdByEmail,
  SessionWallet
} from '@/lib/sessionWalletManager';

// Cookie expiration in days
const COOKIE_EXPIRY_DAYS = 30;

/**
 * POST handler for /api/wallet-session
 * 
 * Sets a secure HTTP-only cookie with wallet information
 * and saves wallet to database for authenticated users
 * 
 * @param req The request object
 * @returns Response with success status
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { wallet, action } = body;
    
    // Get current user session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    
    // Get user ID - either directly from session or by looking up via email
    let userId = session?.user?.id;
    
    // If no user ID but we have an email, try to look up the user ID
    if (!userId && session?.user?.email) {
      try {
        const foundUserId = await getUserIdByEmail(session.user.email);
        if (foundUserId) {
          userId = foundUserId; // Only assign if not null
          console.log(`Found user ID ${userId} for email ${session.user.email}`);
        } else {
          console.warn(`No user ID found for email ${session.user.email}`);
        }
      } catch (error) {
        console.error('Error looking up user ID by email:', error);
      }
    }
    
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
        createdAt: wallet.createdAt || Date.now(),
        walletId: wallet.walletId || wallet.id,
        userId: userId
      };
      
      // If user is authenticated, save wallet to database
      let dbSaveResult = null;
      if (userId) {
        console.log(`Saving wallet to database for user ${userId}`);
        dbSaveResult = await saveWalletToDatabase(sessionWallet, userId);
        console.log('Database save result:', dbSaveResult);
      } else {
        console.warn('No user ID available, skipping database save');
      }
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
      
      // Set the cookie in the response
      const response = NextResponse.json({
        success: true,
        message: 'Wallet saved to session',
        dbSaved: !!dbSaveResult
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
      // Get wallet from cookie to find its ID
      const walletCookie = req.cookies.get(WALLET_COOKIE_NAME);
      let walletId = null;
      
      if (walletCookie) {
        try {
          const walletData = JSON.parse(walletCookie.value) as SessionWallet;
          walletId = walletData.id;
        } catch (parseError) {
          console.error('Error parsing wallet cookie:', parseError);
        }
      }
      
      // If user is authenticated and we have a wallet ID, remove from database
      if (userId && walletId) {
        await removeWalletFromDatabase(walletId);
      }
      
      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'Wallet removed from session and database'
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
 * Retrieves wallet information from the session cookie or database
 * For authenticated users, prioritizes database storage
 * 
 * @returns Response with wallet data or null
 */
export async function GET(req: NextRequest) {
  try {
    // Get current user session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    
    // Get user ID - either directly from session or by looking up via email
    let userId = session?.user?.id;
    
    // If no user ID but we have an email, try to look up the user ID
    if (!userId && session?.user?.email) {
      try {
        const foundUserId = await getUserIdByEmail(session.user.email);
        if (foundUserId) {
          userId = foundUserId; // Only assign if not null
          console.log(`Found user ID ${userId} for email ${session.user.email}`);
        } else {
          console.warn(`No user ID found for email ${session.user.email}`);
        }
      } catch (error) {
        console.error('Error looking up user ID by email:', error);
      }
    }
    
    // If user is authenticated, try to get wallet from database first
    if (userId) {
      const dbWallet = await getWalletFromDatabase(userId);
      
      if (dbWallet) {
        return NextResponse.json({
          success: true,
          wallet: dbWallet,
          source: 'database'
        });
      }
    }
    
    // If no wallet in database or user not authenticated, try cookie
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
      
      // If user is authenticated but wallet wasn't in DB, save it now
      if (userId && wallet) {
        // Add userId to the wallet data
        wallet.userId = userId;
        
        // Save to database
        await saveWalletToDatabase(wallet, userId);
      }
      
      return NextResponse.json({
        success: true,
        wallet,
        source: 'cookie'
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
