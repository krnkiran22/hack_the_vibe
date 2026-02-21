import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useOptimalDEXQuote } from '../hooks/useDEX';
import { executeOptimalSwap } from '../utils/optimalSwap';
import { TESTNET_TOKENS, MAINNET_TOKENS } from '../constants/tokens';
import { DotLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import * as StellarSdk from '@stellar/stellar-sdk';

export default function SwapInterface({ isOpen, onClose }) {
  const { address, provider, network, signTransaction, fetchBalances, balances, syncWithFreighter, switchNetwork } = useWalletStore();

  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);

  // Get quote
  const { data: quote, isLoading: loadingQuote, error: quoteError } = useOptimalDEXQuote(
    fromToken,
    toToken,
    amount,
    !!amount && parseFloat(amount) > 0
  );

  // Force testnet for Freighter users when component opens
  useEffect(() => {
    if (isOpen && provider === 'freighter') {
      const lockToTestnet = async () => {
        try {
          // Always switch to testnet for Freighter users
          console.log('🔄 Locking Freighter user to testnet...');
          await switchNetwork('testnet');
          await fetchBalances();
          console.log('✅ Locked to testnet');
        } catch (error) {
          console.error('❌ Failed to lock to testnet:', error);
        }
      };
      lockToTestnet();
    }
  }, [isOpen, provider, switchNetwork, fetchBalances]);

  // Get appropriate tokens for current network
  const currentTokens = network === 'testnet' ? TESTNET_TOKENS : MAINNET_TOKENS;

  // Get user balance for from token
  const fromTokenBalance = balances.find(b =>
    fromToken === 'XLM' ? b.asset_code === 'XLM' :
      b.asset_code === fromToken && b.asset_issuer === currentTokens[fromToken]?.issuer
  );

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
  };

  const handleMaxClick = () => {
    if (fromTokenBalance) {
      // Reserve some XLM for fees if swapping XLM
      const maxAmount = fromToken === 'XLM'
        ? Math.max(0, parseFloat(fromTokenBalance.balance) - 2).toString()
        : fromTokenBalance.balance;
      setAmount(maxAmount);
    }
  };

  const handleSwap = async () => {
    if (!quote || !address || !provider) {
      toast.error('Missing requirements for swap');
      return;
    }

    // Validate and format amount
    const formattedAmount = parseFloat(amount).toFixed(7);
    if (parseFloat(formattedAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Ensure Freighter users always use testnet
    let swapNetwork = network;
    if (provider === 'freighter') {
      swapNetwork = 'testnet';
      console.log('🔒 Locking Freighter users to testnet for swap');

      // Update app state if not already on testnet
      if (network !== 'testnet') {
        console.log('🔄 Updating app network to testnet...');
        await switchNetwork('testnet');
        await fetchBalances();
      }
    }

    // CRITICAL DEBUG - Verify network configuration
    console.log('🚨 CRITICAL NETWORK DEBUG:', {
      provider,
      originalNetwork: network,
      swapNetwork,
      stellarNetworkParam: swapNetwork === 'testnet' ? 'TESTNET' : 'PUBLIC',
      testnetPassphrase: StellarSdk.Networks.TESTNET,
      publicPassphrase: StellarSdk.Networks.PUBLIC,
      willUsePassphrase: swapNetwork === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
    });

    // Log network information for debugging
    console.log('🌐 Swap Network Info:', {
      originalNetwork: network,
      swapNetwork: swapNetwork,
      stellarNetwork: swapNetwork === 'testnet' ? 'TESTNET' : 'PUBLIC',
      tokens: swapNetwork === 'testnet' ? 'TESTNET_TOKENS' : 'MAINNET_TOKENS'
    });

    // Auto-switch to testnet for Freighter users
    if (provider === 'freighter' && network === 'mainnet') {
      console.log('🔄 Auto-switching Freighter user to testnet...');
      try {
        await switchNetwork('testnet');
        await fetchBalances();
        console.log('✅ Auto-switched to testnet');
      } catch (error) {
        console.error('❌ Auto-switch to testnet failed:', error);
      }
    }

    // Warn about ensuring network match with Freighter
    if (network === 'testnet') {
      toast.info('✅ Using TESTNET - ensure Freighter is on TestNet', {
        autoClose: 3000
      });
    } else {
      toast.info('⚠️ Using MAINNET - ensure Freighter is on MainNet', {
        autoClose: 3000
      });
    }

    // Auto-switch to testnet for Freighter users
    if (provider === 'freighter' && network === 'mainnet') {
      console.log('🔄 Auto-switching Freighter user to testnet before swap...');
      try {
        await switchNetwork('testnet');
        await fetchBalances();
        console.log('✅ Auto-switched to testnet');
        // Network reference updated via switchNetwork call
      } catch (error) {
        console.error('❌ Auto-switch to testnet failed:', error);
        toast.error('Failed to switch to testnet. Please try again.');
        setIsSwapping(false);
        return;
      }
    }

    setIsSwapping(true);
    try {
      console.log('🚀 Starting optimal swap...');
      toast.info(`Initiating swap: ${formattedAmount} ${fromToken} → ${toToken} via ${quote.bestDex}`);

      // Build transaction
      const fromTokenData = currentTokens[fromToken];
      const toTokenData = currentTokens[toToken];

      const transactionXDR = await executeOptimalSwap(
        quote,
        address,
        fromTokenData.code,
        fromTokenData.issuer,
        toTokenData.code,
        toTokenData.issuer,
        slippage,
        swapNetwork === 'testnet' ? 'TESTNET' : 'PUBLIC'
      );

      console.log('📝 Transaction built, requesting signature...');

      // Log comprehensive network info before signing
      const stellarNetwork = swapNetwork === 'testnet' ? 'TESTNET' : 'PUBLIC';
      const stellarPassphrase = swapNetwork === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
      console.log('🔍 Pre-sign Network Validation:', {
        swapNetwork: swapNetwork,
        stellarNetwork,
        stellarPassphrase: stellarPassphrase.slice(0, 20) + '...',
        serverUrl: swapNetwork === 'testnet' ? 'horizon-testnet.stellar.org' : 'horizon.stellar.org'
      });

      // Sign transaction
      const signedXDR = await signTransaction(transactionXDR);

      // Submit to network
      const server = new StellarSdk.Horizon.Server(
        swapNetwork === 'testnet'
          ? 'https://horizon-testnet.stellar.org'
          : 'https://horizon.stellar.org'
      );

      const networkPassphrase = swapNetwork === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;

      const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXDR, networkPassphrase);

      console.log('📡 Submitting to network...');
      const result = await server.submitTransaction(transaction);

      console.log('✅ Swap successful!', result);
      toast.success(
        `Swap completed! ${parseFloat(quote.outputAmount).toFixed(4)} ${toToken} received`
      );

      // Reset form and refresh balances
      setAmount('');
      await fetchBalances();
      onClose();

    } catch (error) {
      console.error('Swap error:', error);

      if (error.message?.includes('Network mismatch')) {
        toast.error(
          <div>
            <div>{error.message}</div>
            <button
              onClick={async () => {
                try {
                  await syncWithFreighter();
                  toast.success('Networks synced! Please try your swap again.');
                } catch (syncError) {
                  toast.error(`Sync failed: ${syncError.message}`);
                }
              }}
              className="mt-2 px-3 py-1 bg-lime-400 text-black rounded text-sm hover:bg-lime-300"
            >
              Sync Networks
            </button>
          </div>,
          { autoClose: false }
        );
      } else if (error.message?.includes('User declined') || error.message?.includes('User rejected')) {
        toast.error('Transaction rejected by user');
      } else if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        toast.error(`Transaction failed: ${codes.transaction || codes.operations?.[0] || 'Unknown error'}`);
      } else {
        toast.error(`Swap failed: ${error.message}`);
      }
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black/90 border border-lime/20 shadow-[0_0_30px_rgba(163,255,18,0.3)]">
        <div
          className="relative p-6"
          style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-lime tracking-widest">STELLAR DEX</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                Optimal Swap Protocol • Network: {network.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {provider === 'freighter' && (
                <button
                  onClick={async () => {
                    try {
                      const newNetwork = await syncWithFreighter();
                      toast.success(`✅ Synced to ${newNetwork?.toUpperCase() || 'network'}`);
                    } catch (error) {
                      toast.error(`Sync failed: ${error.message}`);
                    }
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  title="Sync app network with Freighter"
                >
                  Sync
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* From Token */}
          <div className="mb-4 p-4 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">From</span>
              {fromTokenBalance && (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] text-white/40">
                    Balance: {parseFloat(fromTokenBalance.balance).toFixed(4)}
                  </span>
                  <button
                    onClick={handleMaxClick}
                    className="px-2 py-1 bg-lime/20 hover:bg-lime/30 text-lime text-[8px] font-bold uppercase tracking-wider transition-all"
                  >
                    MAX
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-black/50 border border-white/20 text-white font-bold px-3 py-2 min-w-[80px]"
              >
                {Object.keys(currentTokens).map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-bold text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 bg-lime/20 hover:bg-lime/30 border border-lime/50 text-lime flex items-center justify-center transition-all"
            >
              ↕
            </button>
          </div>

          {/* To Token */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">To</span>
              {quote && (
                <span className="text-[9px] text-white/40">
                  Rate: 1 {fromToken} = {(parseFloat(quote.outputAmount) / parseFloat(amount || '1')).toFixed(4)} {toToken}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-black/50 border border-white/20 text-white font-bold px-3 py-2 min-w-[80px]"
              >
                {Object.keys(currentTokens).map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>

              <div className="flex-1 text-xl font-bold text-lime">
                {loadingQuote ? (
                  <DotLoader size={20} color="#A3FF12" />
                ) : quote ? (
                  parseFloat(quote.outputAmount).toFixed(4)
                ) : (
                  '0.00'
                )}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="mb-6 p-3 bg-lime/5 border border-lime/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-lime font-black uppercase tracking-widest">
                  Best Route: {quote.bestDex}
                </span>
                <span className="text-[10px] text-white/60">
                  Impact: {quote.priceImpact.toFixed(2)}%
                </span>
              </div>

              {quote.sdexQuote && quote.soroswapQuote && (
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="p-2 bg-black/30">
                    <div className="text-white/40 mb-1">SDEX</div>
                    <div className="text-white font-bold">
                      {parseFloat(quote.sdexQuote.outputAmount).toFixed(4)} {toToken}
                    </div>
                  </div>
                  <div className="p-2 bg-black/30">
                    <div className="text-white/40 mb-1">SOROSWAP</div>
                    <div className="text-white font-bold">
                      {parseFloat(quote.soroswapQuote.outputAmount).toFixed(4)} {toToken}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slippage Settings */}
          <div className="mb-6">
            <label className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2 block">
              Slippage Tolerance
            </label>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map(s => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${slippage === s
                      ? 'bg-lime/30 text-lime border border-lime/50'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                    }`}
                >
                  {s}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                step="0.1"
                min="0.1"
                max="50"
                className="flex-1 px-3 py-2 bg-black/50 border border-white/20 text-white text-[10px] font-bold"
                placeholder="Custom %"
              />
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleSwap}
            disabled={!quote || !amount || isSwapping || loadingQuote || !address}
            className="w-full py-3 bg-lime/20 hover:bg-lime/30 disabled:bg-gray-500/20 border border-lime/50 disabled:border-gray-500/50 text-lime disabled:text-gray-400 font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed"
            style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
          >
            {isSwapping ? (
              <div className="flex items-center justify-center space-x-3">
                <DotLoader size={16} color="#A3FF12" />
                <span>EXECUTING SWAP...</span>
              </div>
            ) : !address ? (
              'CONNECT WALLET FIRST'
            ) : !quote ? (
              'ENTER AMOUNT'
            ) : (
              `SWAP ${amount} ${fromToken} → ${toToken}`
            )}
          </button>

          {/* Error Display */}
          {quoteError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px]">
              {quoteError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}