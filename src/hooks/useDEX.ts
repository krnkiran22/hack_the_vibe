import { useQuery } from '@tanstack/react-query';
import { SwapQuote, TokenInfo } from '../types/dex';
import { useWalletStore } from '../store/walletStore';
import { getOptimalSwapQuote } from '../utils/optimalSwap';
import { TESTNET_TOKENS, MAINNET_TOKENS } from '../constants/tokens';

/**
 * Get optimal swap quotes from multiple DEXs
 */
export function useOptimalDEXQuote(
  fromTokenCode: string,
  toTokenCode: string,
  amount: string,
  enabled: boolean = true
) {
  const { network } = useWalletStore();

  return useQuery({
    queryKey: ['optimal-dex-quote', fromTokenCode, toTokenCode, amount, network],
    queryFn: async () => {
      if (!fromTokenCode || !toTokenCode || !amount) {
        throw new Error('Missing required parameters');
      }

      const currentTokens = network === 'testnet' ? TESTNET_TOKENS : MAINNET_TOKENS;
      const fromToken = currentTokens[fromTokenCode as keyof typeof currentTokens];
      const toToken = currentTokens[toTokenCode as keyof typeof currentTokens];

      if (!fromToken || !toToken) {
        throw new Error('Unsupported token');
      }

      return await getOptimalSwapQuote(
        fromToken.code,
        fromToken.issuer,
        toToken.code,
        toToken.issuer,
        amount,
        network === 'mainnet' ? 'PUBLIC' : 'TESTNET'
      );
    },
    enabled: enabled && !!fromTokenCode && !!toTokenCode && !!amount && parseFloat(amount) > 0,
    staleTime: 10000, // 10 seconds
    retry: 2,
  });
}

/**
 * Get supported tokens list
 */
export function useSupportedTokens() {
  const { network } = useWalletStore();

  return useQuery({
    queryKey: ['supported-tokens', network],
    queryFn: async (): Promise<TokenInfo[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return tokens based on network
      const tokens = Object.values(TESTNET_TOKENS);
      
      return tokens.map(token => ({
        code: token.code,
        issuer: token.issuer,
        name: token.name,
        decimals: token.decimals,
      }));
    },
  });
}