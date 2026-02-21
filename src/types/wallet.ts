/**
 * Wallet types for Stellar integration
 */

export type WalletProvider = 'freighter' | 'albedo' | 'rabet' | null;

export type NetworkType = 'testnet' | 'mainnet';

export interface WalletBalance {
  asset_code: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

export interface TokenInfo {
  code: string;
  issuer?: string;
  name: string;
  decimals: number;
  contractAddress?: string;
}

export interface SwapQuote {
  dex: string;
  from_token: TokenInfo;
  to_token: TokenInfo;
  amount_in: string;
  amount_out: string;
  price_impact: number;
  estimated_gas: string;
  route: any[];
  valid_until: number;
}

// Global wallet interfaces
declare global {
  interface Window {
    freighter?: any;
    albedo?: any;
    rabet?: any;
  }
}