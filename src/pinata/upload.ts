import { wrapFetchWithPayment } from 'x402-fetch';
import { createCdpAccount } from '../lib/cdpAccount';

/**
 * Uploads a JSON object to Pinata and pays for it using a CDP wallet.
 * 
 * @param {string} walletId - The ID of the CDP wallet to use for payment.
 * @param {any} body - The JSON-serializable object to upload.
 * @param {string} name - The name for the Pinata upload.
 * @returns The response from the Pinata API.
 */
export async function uploadWithCdp(
  walletId: string, 
  body:  Blob, //considering the data which has to be uploaded is a image 
  name: string
) {
  const cdpAccount = await createCdpAccount(walletId);
  console.log("This is the cdp account", cdpAccount);
  const fetchWithPayment = wrapFetchWithPayment(fetch, cdpAccount);
  console.log("This is the fetch with payment", fetchWithPayment);

  // constructing the pinata body 
  const pinataBody = {
    pinaoptions: {
      cidVersion: 1,
    },
    pinataMetadata: {
      name,
    },
    pinataContent: body,
  };

  // api call 
  const res = await fetchWithPayment(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(pinataBody),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Pinata API error: ${res.status} ${errorBody}`);
  }

  return res.json();
}