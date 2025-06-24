import { CdpClient } from '@coinbase/cdp-sdk';
import { Hex, LocalAccount, SignableMessage } from 'viem';

/**
 * Creates an account object compatible with viem's LocalAccount type,
 * using the Coinbase Developer Platform (CDP) for signing operations.
 *
 * @param {string} walletId - The ID of the wallet to use for signing.
 * @returns A Promise that resolves to a LocalAccount object.
 */
export const createCdpAccount = async (walletId: string): Promise<LocalAccount> => {
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
  });

  // Using `name` as the property based on deduction from documentation.
  const wallet = await cdp.evm.getAccount({ name: `wallets/${walletId}` });
  const address = wallet.address as Hex;
  const publicKey = '0x'; // Placeholder as it's not provided.

  return {
    address,
    publicKey,
    source: 'cdp-proxy',
    type: 'local',

    async signMessage({ message }: { message: SignableMessage }): Promise<Hex> {
      const rawMessage = typeof message === 'string' ? message : message.raw.toString();
      // Using `address` as the property based on documentation examples.
      const result = await cdp.evm.signMessage({ address: wallet.address, message: rawMessage });
      return result.signature as Hex;
    },

    async signTransaction() {
      console.warn('signTransaction is not implemented for CDP account.');
      return '0x';
    },

    async signTypedData() {
      throw new Error('signTypedData is not implemented for CDP account.');
    },
  };
};
