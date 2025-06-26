import { NextRequest, NextResponse } from "next/server";
import { Wallet, Coinbase } from "@coinbase/coinbase-sdk";

interface DeployNFTRequest {
  name: string;
  symbol: string;
  baseURI: string;
  recipientAddress: string;
  quantity: string;
//   wallet_id: string;
}

/**
 * POST handler for /api/nft-minting-agent/deploy-nft
 * Deploys an NFT contract and mints tokens to the specified address
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = (await req.json()) as DeployNFTRequest;

    // Validate required fields
    if (!body.name || !body.symbol || !body.baseURI || !body.recipientAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Configure Coinbase SDK
    const coinbase =  Coinbase.configure({
      apiKeyName: process.env.CDP_API_KEY_ID as string,
      privateKey: process.env.CDP_API_KEY_SECRET as string,
    });
    console.log(coinbase)

    // Create wallet
    const wallet = await Wallet.create();
    const fundedWallet = await wallet.faucet("eth")
    console.log(fundedWallet)
    await fundedWallet.wait()
    console.log("**************")
    console.log("**************")
    console.log(fundedWallet, "fundedWallet")
    console.log("**************")
    console.log("**************")
    // const fetchedWallet= await Wallet.fetch(body.wallet_id)
    const balance = await wallet.listBalances()
    console.log("**************")
    console.log("**************")
    console.log(balance, "balance")
    console.log("**************")
    console.log("**************")
    const address = await wallet.getDefaultAddress();
    console.log(address)

    // Deploy NFT contract
    const nft = await wallet.deployNFT({
      name: body.name,
      symbol: body.symbol,
      baseURI: body.baseURI,
    });
    await nft.wait();
    console.log(nft)

    const contractAddress = nft.getContractAddress();
    console.log(contractAddress)

    // Mint NFTs to the recipient
    const mintTx = await wallet.invokeContract({
      contractAddress,
      method: "mint",
      args: {
        to: body.recipientAddress,
        quantity: body.quantity || "1", // Default to 1 if not specified
      },
    });
    await mintTx.wait();
    console.log(mintTx)

    // Extract transaction details for the frontend
    const transactionDetails = {
      transaction_hash: mintTx.getTransactionHash(),
      transaction_link: `https://sepolia.basescan.org/tx/${mintTx.getTransactionHash()}`,
      status: mintTx.getStatus(),
      network_id: 'base-sepolia',
      from_address_id: address.toString(),
    };
    
    // Get wallet ID if available
    const walletId = wallet.getId ? wallet.getId() : null;
    
    // Return success response with contract details and transaction information
    return NextResponse.json({
      success: true,
      contractAddress,
      deployerAddress: address.toString(),
      name: body.name,
      symbol: body.symbol,
      recipientAddress: body.recipientAddress,
      quantity: body.quantity || "1",
      transaction: transactionDetails,
      wallet_id: walletId,
      networkId: 'base-sepolia'
    });
  } catch (error) {
    console.error("Error deploying NFT:", error);
    return NextResponse.json(
      {
        error: "Failed to deploy NFT",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
