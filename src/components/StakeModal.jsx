import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWalletStore } from '../store/walletStore';
import { canPlayerStake, stakeForGame, getGameStakeRequirement } from '../services/gameStaking';

export default function StakeModal({ isOpen, onClose, onStakeComplete, mapName }) {
  const { isConnected, address, balances } = useWalletStore();
  const [isStaking, setIsStaking] = useState(false);
  const [stakeInfo, setStakeInfo] = useState(null);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Generate a unique game ID
      const newGameId = Date.now();
      setGameId(newGameId);
      
      // Get stake requirements
      const requirements = getGameStakeRequirement();
      setStakeInfo(requirements);
    }
  }, [isOpen]);

  useEffect(() => {
    // Check if player can stake when wallet changes
    if (isOpen && isConnected) {
      checkStakeEligibility();
    }
  }, [isOpen, isConnected, balances]);

  const checkStakeEligibility = async () => {
    if (!isConnected) return;
    
    try {
      await canPlayerStake();
    } catch (error) {
      console.error('Stake eligibility check failed:', error);
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!gameId) {
      toast.error('Invalid game ID');
      return;
    }

    try {
      setIsStaking(true);
      
      // Check if player can stake
      const canStake = await canPlayerStake();
      if (!canStake.canStake) {
        toast.error(canStake.message || 'Cannot stake');
        return;
      }

      // Execute staking
      const result = await stakeForGame(gameId);
      
      if (result.success) {
        toast.success('✅ Stake successful! Entering game...');
        
        // Store game session info
        localStorage.setItem('currentGameSession', JSON.stringify({
          gameId,
          playerAddress: address,
          mapName,
          stakeAmount: stakeInfo?.amount || '2.0000000',
          timestamp: new Date().toISOString()
        }));

        // Call callbacks safely
        try {
          if (typeof onStakeComplete === 'function') {
            onStakeComplete(gameId);
          }
        } catch (callbackError) {
          console.error('onStakeComplete error:', callbackError);
        }
        
        try {
          if (typeof onClose === 'function') {
            onClose();
          }
        } catch (closeError) {
          console.error('onClose error:', closeError);
        }
      } else {
        toast.error(result.error || 'Staking failed');
      }

    } catch (error) {
      console.error('Staking error:', error);
      toast.error(error.message || 'Staking failed');
    } finally {
      setIsStaking(false);
    }
  };

  const getXLMBalance = () => {
    const xlmBalance = balances.find(b => b.asset_code === 'XLM');
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-black/90 border border-lime/20 rounded-lg p-8 max-w-md w-full shadow-[0_0_30px_rgba(163,255,18,0.3)]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-lime rounded-full animate-pulse"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              Mission Entry Fee
            </h3>
          </div>
          <p className="text-white/60 text-sm">
            Stake XLM to enter competitive gameplay
          </p>
        </div>

        {/* Stakes Info */}
        <div className="bg-lime/10 border border-lime/20 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-lime/60 font-black uppercase tracking-widest mb-1">
                Entry Fee
              </div>
              <div className="text-2xl font-black text-lime">
                {stakeInfo?.amount || '2.0000000'} XLM
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">
                Winner Takes
              </div>
              <div className="text-xl font-black text-cyan">
                90% <span className="text-sm text-white/60">of total</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-lime/20">
            <div className="text-[8px] text-white/40 uppercase tracking-widest mb-2">
              Your XLM Balance
            </div>
            <div className="text-lg font-mono text-white">
              {isConnected ? getXLMBalance().toFixed(7) : '0.0000000'} XLM
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Mission Sector
          </div>
          <div className="text-white font-bold">{mapName}</div>
          
          <div className="text-[10px] text-white/40 uppercase tracking-widest mt-2 mb-1">
            Game ID
          </div>
          <div className="text-white/80 font-mono text-sm">#{gameId}</div>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 text-red-400 mt-0.5">
              ⚠️
            </div>
            <div>
              <div className="text-red-400 font-bold text-sm">Risk Notice</div>
              <div className="text-red-200 text-xs mt-1">
                Winner determined by kills. Loser loses entire stake. 10% platform fee applied.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 py-3 px-6 rounded-lg font-bold transition-all duration-200"
            disabled={isStaking}
          >
            Cancel
          </button>
          
          <button
            onClick={handleStake}
            disabled={!isConnected || isStaking || getXLMBalance() < parseFloat(stakeInfo?.amount || '2')}
            className="flex-1 bg-lime/20 hover:bg-lime/30 text-lime border border-lime/40 hover:border-lime/60 py-3 px-6 rounded-lg font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStaking ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-lime/30 border-t-lime rounded-full animate-spin"></div>
                <span>Staking...</span>
              </div>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : getXLMBalance() < parseFloat(stakeInfo?.amount || '2') ? (
              'Insufficient XLM'
            ) : (
              `Stake ${stakeInfo?.amount || '2.0000000'} XLM`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}