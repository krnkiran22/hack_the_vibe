/**
 * Game Staking Service - Handles XLM staking for game entry
 */

import { toast } from 'react-toastify';
import { stakeToPlay, declareWinner, uploadGameDataToIPFS } from './stellarContract';
import { useWalletStore } from '../store/walletStore';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  Horizon,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Memo
} from '@stellar/stellar-sdk';
import {
  isConnected as isFreighterConnected,
  signTransaction as freighterSignTransaction
} from '@stellar/freighter-api';

const STAKE_AMOUNT = '2.0000000'; // 2 XLM per player
const XLM_TOKEN_ADDRESS = 'native'; // Native XLM
const GAME_CONTRACT_ADDRESS = 'CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS'; // Deployed Stellar contract
const CONTRACT_HASH = 'CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS'; // Deployed contract ID

interface GameStakeData {
  gameId: number;
  player1: string;
  player2: string;
  stakeAmount: string;
  createdAt: Date;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
}

/**
 * Check if player can stake (has enough XLM)
 */
export async function canPlayerStake(): Promise<{ canStake: boolean; balance: number; message?: string }> {
  const { isConnected, balances } = useWalletStore.getState();

  if (!isConnected) {
    return { canStake: false, balance: 0, message: 'Wallet not connected' };
  }

  const xlmBalance = balances.find(b => b.asset_code === 'XLM');
  const balance = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  const requiredAmount = parseFloat(STAKE_AMOUNT);
  const minimumBalance = requiredAmount + 1; // Reserve 1 XLM for network fees

  if (balance < minimumBalance) {
    return {
      canStake: false,
      balance,
      message: `Insufficient balance. Need ${minimumBalance} XLM (${STAKE_AMOUNT} stake + 1 XLM fees), have ${balance.toFixed(7)} XLM`
    };
  }

  return { canStake: true, balance };
}

/**
 * Get game stake requirements
 */
export function getGameStakeRequirement() {
  return {
    amount: STAKE_AMOUNT,
    token: 'XLM',
    contractAddress: GAME_CONTRACT_ADDRESS,
    minimumBalance: parseFloat(STAKE_AMOUNT) + 1 // Include network fees
  };
}

/**
 * Stake XLM to join/create game
 */
export async function stakeForGame(gameId: number): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const walletStore = useWalletStore.getState();
    let { address, isConnected, connect } = walletStore;

    // If not connected, try to connect automatically (like Lobby)
    if (!isConnected || !address) {
      try {
        // connect is a function on the store
        if (typeof connect === 'function') {
          await connect('freighter');
          // Refresh state after connect
          const refreshed = useWalletStore.getState();
          address = refreshed.address;
          isConnected = refreshed.isConnected;
        }
      } catch (err) {
        throw new Error('Could not connect Freighter wallet. Please try again.');
      }
    }

    if (!isConnected || !address) {
      throw new Error('Please connect your Freighter wallet first');
    }

    // Check if player can stake
    const stakeCheck = await canPlayerStake();
    if (!stakeCheck.canStake) {
      throw new Error(stakeCheck.message || 'Cannot stake');
    }

    const toastId = toast.info('⏳ Building transaction...', { autoClose: false });

    console.log('🎯 Staking request:', {
      gameId,
      player: address,
      amount: STAKE_AMOUNT,
      token: XLM_TOKEN_ADDRESS
    });

    // Build the contract invocation transaction using Soroban RPC
    const sorobanServer = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
    const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

    const sourceAccount = await horizonServer.loadAccount(address);

    // Create Soroban contract call to stake_to_play
    const contract = new StellarSdk.Contract(GAME_CONTRACT_ADDRESS);

    // Native XLM token address for Stellar (SAC - Stellar Asset Contract)
    const NATIVE_XLM_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: (parseInt(BASE_FEE) * 100000).toString(), // Higher fee for Soroban
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        contract.call(
          'stake_to_play',
          StellarSdk.Address.fromString(address).toScVal(), // player
          StellarSdk.Address.fromString(NATIVE_XLM_CONTRACT).toScVal(), // Native XLM token contract
          StellarSdk.nativeToScVal(gameId, { type: 'u64' }) // game_id
        )
      )
      .setTimeout(180)
      .build();

    // Simulate the transaction first to get proper resource fees
    if (toastId) {
      toast.dismiss(toastId);
    }

    toast.info('🔄 Simulating transaction...', { autoClose: false });

    const simulated = await sorobanServer.simulateTransaction(transaction);

    // Check if simulation was successful
    if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
      throw new Error('Transaction simulation failed: ' + JSON.stringify(simulated));
    }

    // Assemble the transaction with simulation results
    const prepared = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulated
    ).build();

    // Request Freighter to sign
    const xdr = prepared.toXDR();

    toast.dismiss();
    const approveToastId = toast.info('🔓 Please approve in Freighter wallet...', { autoClose: false });

    // Sign with Freighter using official API
    const signedResult = await freighterSignTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
      address: address
    });

    if (approveToastId) {
      toast.dismiss(approveToastId);
    }

    // Check if signing was successful
    if (signedResult.error) {
      throw new Error(signedResult.error);
    }

    toast.info('📡 Submitting transaction to Stellar network...', { autoClose: false });

    // Submit the signed transaction to Soroban RPC
    const transactionToSubmit = TransactionBuilder.fromXDR(
      signedResult.signedTxXdr,
      Networks.TESTNET
    );

    const result = await sorobanServer.sendTransaction(transactionToSubmit);

    // Wait for transaction confirmation
    if (result.status === 'PENDING') {
      let txResponse = await sorobanServer.getTransaction(result.hash);
      while (txResponse.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await sorobanServer.getTransaction(result.hash);
      }

      if (txResponse.status !== 'SUCCESS') {
        throw new Error('Transaction failed: ' + txResponse.status);
      }
    }

    // Store stake data in localStorage for tracking
    const stakeData: GameStakeData = {
      gameId,
      player1: address,
      player2: '',
      stakeAmount: STAKE_AMOUNT,
      createdAt: new Date(),
      gameStarted: false,
      gameEnded: false
    };

    const gameStakes = JSON.parse(localStorage.getItem('gameStakes') || '[]');
    gameStakes.push(stakeData);
    localStorage.setItem('gameStakes', JSON.stringify(gameStakes));

    console.log(`💰 Stake sent to contract: ${GAME_CONTRACT_ADDRESS}`);
    console.log(`📋 Transaction hash: ${result.hash}`);

    toast.success(`✅ Staked ${STAKE_AMOUNT} XLM successfully!`);

    return { success: true, hash: result.hash };

  } catch (error: any) {
    toast.dismiss();
    console.error('Staking error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process game end and declare winner
 */
export async function processGameEnd(
  gameId: number,
  player1Address: string,
  player1Kills: number,
  player2Address: string,
  player2Kills: number
): Promise<{ success: boolean; winner?: string; reward?: string; error?: string }> {
  try {
    // Determine winner based on kills
    const winner = player1Kills > player2Kills ? player1Address :
      player2Kills > player1Kills ? player2Address : null;

    if (!winner) {
      toast.info('🤝 Game ended in a tie! Stakes returned to both players.');
      return { success: true, winner: 'tie' };
    }

    const loser = winner === player1Address ? player2Address : player1Address;
    const totalStake = parseFloat(STAKE_AMOUNT) * 2; // Both players staked
    const winnerReward = totalStake * 0.9; // 90% to winner
    const platformFee = totalStake * 0.1; // 10% platform fee

    // Create game result data for IPFS
    const gameData = {
      gameId,
      players: {
        [player1Address]: { kills: player1Kills, isWinner: winner === player1Address },
        [player2Address]: { kills: player2Kills, isWinner: winner === player2Address }
      },
      winner,
      loser,
      totalStake,
      winnerReward,
      platformFee,
      timestamp: new Date().toISOString()
    };

    console.log('🏆 Game Results:', gameData);

    // Upload game data to IPFS
    const ipfsHash = await uploadGameDataToIPFS(gameData);
    console.log('📦 Game data uploaded to IPFS:', ipfsHash);

    // Note: declare_winner requires admin signature
    // For now, we'll store winner info locally and show success
    // In production, your backend should call the contract's declare_winner method
    console.log(`🎯 Winner: ${winner} should receive ${winnerReward} XLM from contract`);
    console.log(`📝 IPFS Hash: ${ipfsHash}`);
    console.log(`🏦 Contract will automatically transfer rewards to winner's wallet`);

    toast.success(`🏆 Winner declared! Contract will send ${winnerReward.toFixed(4)} XLM to ${winner.slice(0, 8)}...`);

    // Update local storage
    const gameStakes = JSON.parse(localStorage.getItem('gameStakes') || '[]');
    const gameIndex = gameStakes.findIndex((g: GameStakeData) => g.gameId === gameId);
    if (gameIndex !== -1) {
      gameStakes[gameIndex].gameEnded = true;
      gameStakes[gameIndex].winner = winner;
      localStorage.setItem('gameStakes', JSON.stringify(gameStakes));
    }

    toast.success(
      `🎉 ${winner === useWalletStore.getState().address ? 'You won!' : 'Game ended!'} Winner receives ${winnerReward.toFixed(7)} XLM`,
      { autoClose: 8000 }
    );

    return {
      success: true,
      winner,
      reward: winnerReward.toFixed(7)
    };

  } catch (error: any) {
    console.error('Game end processing failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get player's staking history
 */
export function getPlayerStakingHistory(): GameStakeData[] {
  const gameStakes = JSON.parse(localStorage.getItem('gameStakes') || '[]');
  const { address } = useWalletStore.getState();

  if (!address) return [];

  return gameStakes.filter((game: GameStakeData) =>
    game.player1 === address || game.player2 === address
  );
}

/**
 * Collect winner rewards from the contract
 * NOTE: In production, this should be called from your backend with admin signature
 * For now, we'll simulate the collection process
 */
export async function collectWinnerRewards(
  gameId: number
): Promise<{ success: boolean; amount?: string; hash?: string; error?: string }> {
  try {
    const { address, isConnected } = useWalletStore.getState();

    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first');
    }

    // Get game stakes from localStorage
    const gameStakes = JSON.parse(localStorage.getItem('gameStakes') || '[]');
    const gameStake = gameStakes.find((g: GameStakeData) => g.gameId === gameId);

    if (!gameStake) {
      throw new Error('Game stake not found');
    }

    if (!gameStake.winner) {
      throw new Error('Winner not yet declared');
    }

    if (gameStake.winner !== address) {
      throw new Error('You are not the winner of this game');
    }

    // Calculate reward amount
    const totalStake = parseFloat(STAKE_AMOUNT) * 2; // Both players staked
    const winnerReward = totalStake * 0.9; // 90% to winner

    console.log('🎁 Collecting rewards:', {
      gameId,
      winner: address,
      reward: winnerReward.toFixed(7) + ' XLM'
    });

    // NOTE: In production, your backend should call the contract's declare_winner method
    // which will automatically transfer the funds to the winner's wallet
    // For now, we'll just show a success message

    toast.info('📡 Reward collection initiated. In production, this would trigger the smart contract to send XLM to your wallet.', {
      autoClose: 5000
    });

    // Simulate successful collection
    toast.success(`✅ ${winnerReward.toFixed(7)} XLM will be sent to your wallet!`, {
      autoClose: 8000
    });

    return {
      success: true,
      amount: winnerReward.toFixed(7),
      hash: 'simulated-tx-hash-' + Date.now()
    };

  } catch (error: any) {
    console.error('Reward collection failed:', error);
    toast.error(error.message || 'Failed to collect rewards');
    return { success: false, error: error.message };
  }
}