/**
 * SDEX (Stellar Decentralized Exchange) Integration
 * Handles quotes and swaps through Stellar's native DEX
 */

import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Format amount for Stellar operations (max 7 decimal places)
 */
function formatStellarAmount(amount: string | number): string {
  return parseFloat(amount.toString()).toFixed(7);
}

interface SDEXQuote {
  inputAmount: string;
  outputAmount: string;
  path: string[];
  priceImpact: number;
  source: 'SDEX';
}

/**
 * Get the Horizon server URL for the specified network
 */
function getHorizonUrl(network: 'TESTNET' | 'PUBLIC'): string {
  return network === 'TESTNET'
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org';
}

/**
 * Get SDEX quote for swap using path payments
 * @param fromAsset - Source asset (e.g., USDC)
 * @param toAsset - Destination asset (e.g., XLM)
 * @param amount - Amount to swap
 * @param network - 'TESTNET' or 'PUBLIC'
 */
export async function getSDEXQuote(
  fromAsset: StellarSdk.Asset,
  toAsset: StellarSdk.Asset,
  amount: string,
  network: 'TESTNET' | 'PUBLIC' = 'TESTNET'
): Promise<SDEXQuote> {
  try {
    const serverUrl = getHorizonUrl(network);
    const server = new StellarSdk.Horizon.Server(serverUrl);

    console.log('🔍 Getting SDEX quote:', {
      from: fromAsset.isNative() ? 'XLM' : `${fromAsset.getCode()}:${fromAsset.getIssuer()}`,
      to: toAsset.isNative() ? 'XLM' : `${toAsset.getCode()}:${toAsset.getIssuer()}`,
      amount
    });

    // Find strict send path (best rate for exact input amount)
    const pathsResponse = await server
      .strictSendPaths(fromAsset, amount, [toAsset])
      .call();

    console.log('SDEX paths response:', {
      recordsCount: pathsResponse.records.length,
      fromAsset: fromAsset.isNative() ? 'XLM' : `${fromAsset.getCode()}:${fromAsset.getIssuer()}`,
      toAsset: toAsset.isNative() ? 'XLM' : `${toAsset.getCode()}:${toAsset.getIssuer()}`,
      amount
    });

    if (pathsResponse.records.length === 0) {
      throw new Error(
        `No liquidity path found on SDEX for ${fromAsset.isNative() ? 'XLM' : fromAsset.getCode()} → ${toAsset.isNative() ? 'XLM' : toAsset.getCode()}. ` +
        `This could mean: 1) No trading pairs exist, 2) Insufficient liquidity, or 3) You need to add a trustline for ${toAsset.getCode()}.`
      );
    }

    // Get best path (first record is optimal)
    const bestPath = pathsResponse.records[0];

    console.log('✅ SDEX quote found:', {
      input: amount,
      output: bestPath.destination_amount,
      pathLength: bestPath.path.length
    });

    return {
      inputAmount: amount,
      outputAmount: bestPath.destination_amount,
      path: bestPath.path.map((asset: any) =>
        asset.asset_type === 'native' ? 'XLM' : `${asset.asset_code}:${asset.asset_issuer}`
      ),
      priceImpact: calculatePriceImpact(amount, bestPath.destination_amount, fromAsset, toAsset),
      source: 'SDEX',
    };
  } catch (error: any) {
    console.error('SDEX quote error:', error);
    throw new Error(`SDEX quote failed: ${error.message}`);
  }
}

/**
 * Build SDEX swap transaction using Path Payment Strict Send
 * @param userPublicKey - User's Stellar public key
 * @param fromAsset - Source asset
 * @param toAsset - Destination asset  
 * @param amount - Amount to send
 * @param minAmount - Minimum amount to receive (slippage protection)
 * @param network - 'TESTNET' or 'PUBLIC'
 * @returns Transaction XDR string
 */
export async function buildSDEXSwap(
  userPublicKey: string,
  fromAsset: StellarSdk.Asset,
  toAsset: StellarSdk.Asset,
  amount: string,
  minAmount: string,
  network: 'TESTNET' | 'PUBLIC' = 'TESTNET'
): Promise<string> {
  try {
    console.log('🌐 SDEX Network Config:', {
      network,
      serverUrl: network === 'TESTNET' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org',
      passphrase: network === 'TESTNET' ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015'
    });

    const serverUrl = getHorizonUrl(network);
    const server = new StellarSdk.Horizon.Server(serverUrl);
    const networkPassphrase = network === 'TESTNET'
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC;

    console.log('🏗️ Building SDEX swap transaction...');

    // Load user account and check trustlines
    let account;
    try {
      account = await server.loadAccount(userPublicKey);
      console.log('✅ Account loaded successfully');

      // Check if user has trustline for destination asset (if not native)
      if (!toAsset.isNative()) {
        const hasTrustline = account.balances.some((balance: any) =>
          balance.asset_type !== 'native' &&
          balance.asset_code === toAsset.getCode() &&
          balance.asset_issuer === toAsset.getIssuer()
        );

        if (!hasTrustline) {
          throw new Error(
            `Missing trustline for ${toAsset.getCode()}:${toAsset.getIssuer()}. ` +
            `Please add a trustline for ${toAsset.getCode()} in your wallet before swapping.`
          );
        }
        console.log(`✅ Trustline exists for ${toAsset.getCode()}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Account ${userPublicKey} not found on the network. Please fund your account first.`);
      }
      throw error;
    }

    // Get optimal path
    const pathsResponse = await server
      .strictSendPaths(fromAsset, amount, [toAsset])
      .call();

    console.log('SDEX swap paths response:', {
      recordsCount: pathsResponse.records.length,
      fromAsset: fromAsset.isNative() ? 'XLM' : `${fromAsset.getCode()}:${fromAsset.getIssuer()}`,
      toAsset: toAsset.isNative() ? 'XLM' : `${toAsset.getCode()}:${toAsset.getIssuer()}`
    });

    if (pathsResponse.records.length === 0) {
      throw new Error(
        `No swap path available for ${fromAsset.isNative() ? 'XLM' : fromAsset.getCode()} → ${toAsset.isNative() ? 'XLM' : toAsset.getCode()}. ` +
        `Check: 1) Asset trustlines, 2) Network liquidity, 3) Asset addresses.`
      );
    }

    const bestPath = pathsResponse.records[0];

    // Build transaction
    console.log('🔍 PRE-TRANSACTION DEBUG:', {
      network,
      networkPassphrase,
      isTestnet: networkPassphrase === StellarSdk.Networks.TESTNET,
      testnetPassphrase: StellarSdk.Networks.TESTNET,
      publicPassphrase: StellarSdk.Networks.PUBLIC
    });

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.pathPaymentStrictSend({
          sendAsset: fromAsset,
          sendAmount: formatStellarAmount(amount),
          destination: userPublicKey, // Send to self
          destAsset: toAsset,
          destMin: formatStellarAmount(minAmount),
          path: bestPath.path.map((asset: any) =>
            asset.asset_type === 'native'
              ? StellarSdk.Asset.native()
              : new StellarSdk.Asset(asset.asset_code, asset.asset_issuer)
          ),
        })
      )
      .setTimeout(180)
      .build();

    console.log('✅ SDEX transaction built successfully');
    console.log('🔍 POST-TRANSACTION DEBUG:', {
      builtPassphrase: transaction.networkPassphrase,
      matchesTestnet: transaction.networkPassphrase === StellarSdk.Networks.TESTNET,
      matchesPublic: transaction.networkPassphrase === StellarSdk.Networks.PUBLIC
    });

    return transaction.toXDR();
  } catch (error: any) {
    console.error('SDEX swap build error:', error);
    throw new Error(`Failed to build SDEX swap: ${error.message}`);
  }
}

/**
 * Calculate price impact for a swap
 */
function calculatePriceImpact(
  inputAmount: string,
  outputAmount: string,
  fromAsset: StellarSdk.Asset,
  toAsset: StellarSdk.Asset
): number {
  // Simple price impact calculation
  // In production, you'd want to compare against current market rate
  const inputNum = parseFloat(inputAmount);
  const outputNum = parseFloat(outputAmount);

  if (inputNum === 0 || outputNum === 0) return 0;

  // For demonstration, assume 1:1 rate and calculate deviation
  const rate = outputNum / inputNum;
  return Math.abs((1 - rate) * 100);
}