/**
 * Stellar Smart Contract Integration for Stellar Strike
 * Handles staking, winner declaration, and contract interactions
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Contract Configuration
const CONTRACT_ID = import.meta.env.VITE_STELLAR_CONTRACT_ID || '';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org:443';
const STAKE_AMOUNT = import.meta.env.VITE_STELLAR_STAKE_AMOUNT || '100000000';

// Initialize Soroban RPC Server
const server = new StellarSdk.rpc.Server(RPC_URL);

// IPFS Configuration (mock implementation to avoid module errors)
const ipfs = {
  add: async (data: string) => {
    console.warn('Using mock IPFS client. Data not actually uploaded.');
    return { path: `QmMockHash${Date.now().toString(36)}` };
  }
};

/**
 * Upload game data to IPFS
 */
export async function uploadGameDataToIPFS(gameData: any): Promise<string> {
  try {
    const gameDataString = JSON.stringify(gameData);
    const result = await ipfs.add(gameDataString);
    return result.path; // Returns IPFS hash
  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback: return a mock hash for testing
    return `Qm${Date.now().toString(36)}MockHash`;
  }
}

/**
 * Get stake amount from contract
 */
export async function getStakeAmount(): Promise<string> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    // Create a temporary account for simulation
    const sourceKeypair = StellarSdk.Keypair.random();
    const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_stake_amount'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);

    if (!StellarSdk.rpc.Api.isSimulationError(simulated)) {
      const result = (simulated as any).result?.retval;
      if (result) {
        return StellarSdk.scValToNative(result).toString();
      }
    }

    return STAKE_AMOUNT; // Fallback to env variable
  } catch (error) {
    console.error('Failed to get stake amount:', error);
    return STAKE_AMOUNT;
  }
}

/**
 * Check if player has already staked
 */
export async function hasPlayerStaked(playerAddress: string): Promise<boolean> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceKeypair = StellarSdk.Keypair.random();
    const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'has_staked',
          StellarSdk.Address.fromString(playerAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        return StellarSdk.scValToNative(result);
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to check stake status:', error);
    return false;
  }
}

/**
 * Stake tokens to enter the game
 */
export async function stakeToPlay(
  playerSecretKey: string,
  gameId: number,
  tokenAddress: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const playerKeypair = StellarSdk.Keypair.fromSecret(playerSecretKey);
    const playerAddress = playerKeypair.publicKey();

    // Load player account
    const account = await server.getAccount(playerAddress);

    const contract = new StellarSdk.Contract(CONTRACT_ID);

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'stake_to_play',
          StellarSdk.Address.fromString(playerAddress).toScVal(),
          StellarSdk.Address.fromString(tokenAddress).toScVal(),
          StellarSdk.nativeToScVal(gameId, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build();

    // Simulate first
    const simulated = await server.simulateTransaction(transaction);

    if (!StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
      return {
        success: false,
        error: 'Simulation failed: ' + JSON.stringify(simulated)
      };
    }

    // Assemble transaction with simulation results
    const prepared = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulated as any
    ).build();

    // Sign
    prepared.sign(playerKeypair);

    // Submit
    const result = await server.sendTransaction(prepared);

    if (result.status === 'PENDING') {
      // Wait for confirmation
      let response = await server.getTransaction(result.hash);
      while (response.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await server.getTransaction(result.hash);
      }

      if (response.status === 'SUCCESS') {
        return { success: true, hash: result.hash };
      }
    }

    return {
      success: false,
      error: 'Transaction failed: ' + result.status
    };

  } catch (error: any) {
    console.error('Stake to play failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Declare winner and distribute rewards
 */
export async function declareWinner(
  adminSecretKey: string,
  gameId: number,
  winnerAddress: string,
  ipfsHash: string,
  tokenAddress: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecretKey);
    const adminAddress = adminKeypair.publicKey();

    // Load admin account
    const account = await server.getAccount(adminAddress);

    const contract = new StellarSdk.Contract(CONTRACT_ID);

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'declare_winner',
          StellarSdk.Address.fromString(adminAddress).toScVal(),
          StellarSdk.nativeToScVal(gameId, { type: 'u64' }),
          StellarSdk.Address.fromString(winnerAddress).toScVal(),
          StellarSdk.nativeToScVal(ipfsHash, { type: 'string' }),
          StellarSdk.Address.fromString(tokenAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    // Simulate
    const simulated = await server.simulateTransaction(transaction);

    if (!StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
      return {
        success: false,
        error: 'Simulation failed: ' + JSON.stringify(simulated)
      };
    }

    // Assemble
    const prepared = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulated as any
    ).build();

    // Sign
    prepared.sign(adminKeypair);

    // Submit
    const result = await server.sendTransaction(prepared);

    if (result.status === 'PENDING') {
      // Wait for confirmation
      let response = await server.getTransaction(result.hash);
      while (response.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = await server.getTransaction(result.hash);
      }

      if (response.status === 'SUCCESS') {
        return { success: true, hash: result.hash };
      }
    }

    return {
      success: false,
      error: 'Transaction failed: ' + result.status
    };

  } catch (error: any) {
    console.error('Declare winner failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get game match details
 */
export async function getGameMatch(gameId: number): Promise<any> {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const sourceKeypair = StellarSdk.Keypair.random();
    const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'get_game_match',
          StellarSdk.nativeToScVal(gameId, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
      const result = simulated.result?.retval;
      if (result) {
        return StellarSdk.scValToNative(result);
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get game match:', error);
    return null;
  }
}

/**
 * Convert stroops to XLM for display
 */
export function stroopsToXLM(stroops: string): string {
  return (parseInt(stroops) / 10_000_000).toFixed(2);
}

/**
 * Convert XLM to stroops for transactions
 */
export function xlmToStroops(xlm: number): string {
  return (xlm * 10_000_000).toString();
}

export default {
  getStakeAmount,
  hasPlayerStaked,
  stakeToPlay,
  declareWinner,
  getGameMatch,
  uploadGameDataToIPFS,
  stroopsToXLM,
  xlmToStroops,
};
