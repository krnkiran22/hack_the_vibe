/**
 * Optimal Swap Logic - Compares SDEX and Soroswap to find best route
 */

import { getSDEXQuote, buildSDEXSwap } from './sdex';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Format amount for Stellar operations (max 7 decimal places)
 */
function formatStellarAmount(amount: string | number): string {
  return parseFloat(amount.toString()).toFixed(7);
}

interface OptimalQuote {
  bestDex: 'SDEX' | 'SOROSWAP';
  inputAmount: string;
  outputAmount: string;
  path: string[];
  priceImpact: number;
  sdexQuote?: any;
  soroswapQuote?: any;
}

interface MockSoroswapQuote {
  inputAmount: string;
  outputAmount: string;
  path: string[];
  protocols: string[];
  priceImpact: number;
  source: 'SOROSWAP';
}

/**
 * Mock Soroswap quote function (replace with actual Soroswap SDK when available)
 */
async function getMockSoroswapQuote(
  fromAssetCode: string,
  toAssetCode: string,
  amount: string
): Promise<MockSoroswapQuote> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock better rate than SDEX (for demonstration)
  const outputAmount = (parseFloat(amount) * 0.98).toString(); // 2% better than SDEX
  
  return {
    inputAmount: amount,
    outputAmount,
    path: [fromAssetCode, toAssetCode],
    protocols: ['SOROSWAP_AMM'],
    priceImpact: 1.5,
    source: 'SOROSWAP',
  };
}

/**
 * Get quotes from SDEX only (Soroswap integration pending)
 */
export async function getOptimalSwapQuote(
  fromAssetCode: string,
  fromAssetIssuer: string | null, // null for XLM (native)
  toAssetCode: string,
  toAssetIssuer: string | null,
  amount: string,
  network: 'TESTNET' | 'PUBLIC' = 'TESTNET'
): Promise<OptimalQuote> {
  try {
    console.log('🔍 Getting SDEX swap quote...');

    // Create Stellar assets for SDEX
    const fromAsset = fromAssetIssuer
      ? new StellarSdk.Asset(fromAssetCode, fromAssetIssuer)
      : StellarSdk.Asset.native();
    
    const toAsset = toAssetIssuer
      ? new StellarSdk.Asset(toAssetCode, toAssetIssuer)
      : StellarSdk.Asset.native();

    // Get quote from SDEX only
    const sdex = await getSDEXQuote(fromAsset, toAsset, formatStellarAmount(amount), network);

    console.log('📊 SDEX Quote:', `${sdex.outputAmount} ${toAssetCode}`);

    if (!sdex) {
      throw new Error('No quote available from SDEX');
    }

    console.log(`🎯 Using SDEX: ${sdex.outputAmount} ${toAssetCode}`);

    return {
      bestDex: 'SDEX' as const,
      inputAmount: formatStellarAmount(amount),
      outputAmount: formatStellarAmount(sdex.outputAmount),
      path: sdex.path || [fromAssetCode, toAssetCode],
      priceImpact: sdex.priceImpact || 0,
      sdexQuote: sdex,
      soroswapQuote: null,
    };
  } catch (error: any) {
    console.error('Optimal quote error:', error);
    throw new Error(`Failed to get optimal quote: ${error.message}`);
  }
}

/**
 * Execute swap on the optimal DEX
 */
export async function executeOptimalSwap(
  optimalQuote: OptimalQuote,
  userPublicKey: string,
  fromAssetCode: string,
  fromAssetIssuer: string | null,
  toAssetCode: string,
  toAssetIssuer: string | null,
  slippagePercent: number = 0.5,
  network: 'TESTNET' | 'PUBLIC' = 'TESTNET'
): Promise<string> {
  try {
    console.log('🚀 Executing swap on SDEX...');

    const minAmount = (
      parseFloat(optimalQuote.outputAmount) * (1 - slippagePercent / 100)
    ).toFixed(7); // Ensure at most 7 decimal places for Stellar

    // Always use SDEX for now
    const fromAsset = fromAssetIssuer
      ? new StellarSdk.Asset(fromAssetCode, fromAssetIssuer)
      : StellarSdk.Asset.native();
    
    const toAsset = toAssetIssuer
      ? new StellarSdk.Asset(toAssetCode, toAssetIssuer)
      : StellarSdk.Asset.native();
    
    return await buildSDEXSwap(
      userPublicKey,
      fromAsset,
      toAsset,
      formatStellarAmount(optimalQuote.inputAmount),
      minAmount,
      network
    );
  } catch (error: any) {
    console.error('Execute swap error:', error);
    throw new Error(`Swap execution failed: ${error.message}`);
  }
}