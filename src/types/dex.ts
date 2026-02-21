/**
 * DEX types for swap functionality
 */

import { TokenInfo } from './wallet';

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

export { TokenInfo };