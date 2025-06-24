import { wrapFetchWithPayment } from 'x402-fetch';
import { createCdpAccount } from '../lib/cdpAccount';

/**
 * Retrieves an asset from a URL using a CDP account for payment.
 *
 * @param {string} walletId - The ID of the wallet to use for signing.
 * @param {string} url - The URL of the asset to retrieve.
 * @returns {Promise<{ url: string }>} A promise that resolves to the asset data.
 */
export async function retrieveAssetsWithCDP(
  walletId: string,
  url: string,
): Promise<{ url: string }> {
  try {
    const cdpAccount = await createCdpAccount(walletId);
    const fetchWithPayment = wrapFetchWithPayment(fetch, cdpAccount);

    const response = await fetchWithPayment(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = (await response.json()) as { url: string };
    console.log('Retrieved asset:', body);
    return body;
  } catch (err) {
    console.error('Failed to retrieve asset:', err);
    throw err;
  }
}
