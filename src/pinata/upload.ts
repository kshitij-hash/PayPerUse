// TODO: Need to check this file 

import { wrapFetchWithPayment } from 'x402-fetch';
import { createCdpAccount } from '../lib/cdpAccount';

/**
 * Uploads a file Blob to Pinata and pays for it using a CDP wallet.
 * 
 * @param {string} walletId - The ID of the CDP wallet to use for payment.
 * @param {Blob} body - The file Blob to upload.
 * @param {string} name - The name for the Pinata upload.
 * @returns The response from the Pinata API.
 */
export async function uploadWithCdp(
  walletId: string, 
  body:  Blob, 
  name: string
) {
  const cdpAccount = await createCdpAccount(walletId);
  const fetchWithPayment = wrapFetchWithPayment(fetch, cdpAccount);

  // constructing the pinata body as FormData
  const formData = new FormData();
  formData.append('file', body, name);

  const pinataMetadata = JSON.stringify({ name });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  formData.append('pinataOptions', pinataOptions);

  // api call 
  const res = await fetchWithPayment(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Pinata API error: ${res.status} ${errorBody}`);
  }

  return res.json();
}