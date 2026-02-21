/**
 * Freighter Wallet API Types
 */

interface FreighterApi {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, options?: {
    network?: string;
    networkPassphrase?: string;
    accountToSign?: string;
  }): Promise<string>;
  signAuthEntry(
    entryPreimageXDR: string,
    options?: {
      accountToSign?: string;
    }
  ): Promise<string>;
}

interface Window {
  freighterApi?: FreighterApi;
}
