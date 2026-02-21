import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletProvider, NetworkType, WalletBalance } from '../types/wallet';
import * as StellarSdk from '@stellar/stellar-sdk';
import { 
  isConnected, 
  requestAccess, 
  getNetwork,
  signTransaction as freighterSignTransaction 
} from '@stellar/freighter-api';

interface WalletState {
  // State
  address: string | null;
  provider: WalletProvider;
  network: NetworkType;
  balances: WalletBalance[];
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  username: string | null;
  
  // Actions
  connect: (provider: WalletProvider) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: NetworkType) => Promise<void>;
  fetchBalances: () => Promise<void>;
  setError: (error: string | null) => void;
  signTransaction: (transactionXDR: string) => Promise<string>;
  syncWithFreighter: () => Promise<string | undefined>;
  setUsername: (name: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state (force testnet)
      address: null,
      provider: null,
      network: 'testnet', // Always testnet
      balances: [],
      isConnecting: false,
      isConnected: false,
      error: null,
      username: null,

      // Connect wallet
      connect: async (provider: WalletProvider) => {
        set({ isConnecting: true, error: null });
        
        try {
          let publicKey: string | null = null;

          if (provider === 'freighter') {
            // Wait a bit for extension to load if needed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            try {
              // Request access directly - this will fail gracefully if not installed
              const accessResult = await requestAccess();
              
              if (accessResult.error) {
                if (accessResult.error.includes('extension')) {
                  throw new Error('Freighter wallet not found. Please install the Freighter browser extension from freighter.app and refresh the page.');
                }
                throw new Error(accessResult.error);
              }
              
              if (accessResult.address) {
                publicKey = accessResult.address;
                
                // Auto-sync app network with Freighter's network
                try {
                  const freighterNetwork = await getNetwork();
                  // Freighter returns {network: 'TESTNET' | 'PUBLIC', networkPassphrase: '...'}
                  const networkValue = typeof freighterNetwork === 'string' 
                    ? freighterNetwork 
                    : freighterNetwork.network || freighterNetwork;
                  const appNetwork = networkValue === 'TESTNET' ? 'testnet' : 'mainnet';
                  console.log('🔄 Auto-syncing app network to Freighter:', {
                    freighterNetwork,
                    appNetwork
                  });
                  set({ network: appNetwork });
                } catch (networkError) {
                  console.warn('Could not detect Freighter network, using testnet default:', networkError);
                }
                
                console.log('✅ Freighter connected:', publicKey.slice(0, 4) + '...' + publicKey.slice(-4));
              }
            } catch (err: any) {
              if (err.message?.includes('User declined access') || err.message?.includes('User rejected')) {
                throw new Error('Connection rejected. Please approve the connection in Freighter.');
              }
              // Check if it's an extension not found error
              if (err.message?.includes('not defined') || err.message?.includes('extension')) {
                throw new Error('Freighter wallet not found. Please install the Freighter browser extension from freighter.app and refresh the page.');
              }
              throw err;
            }
            
          } else if (provider === 'albedo') {
            if (!window.albedo) {
              throw new Error('Albedo wallet not installed');
            }
            const result = await window.albedo.publicKey();
            publicKey = result.pubkey;
          } else if (provider === 'rabet') {
            if (!window.rabet) {
              throw new Error('Rabet wallet not installed');
            }
            const result = await window.rabet.connect();
            publicKey = result.publicKey;
          }

          if (publicKey) {
            console.log('✅ Setting wallet state with address:', publicKey.slice(0, 6) + '...' + publicKey.slice(-4));
            set({ 
              address: publicKey, 
              provider, 
              isConnected: true,
              isConnecting: false,
              error: null
            });
            // Fetch balances after connecting
            console.log('🔄 Fetching balances...');
            await get().fetchBalances();
            console.log('✅ Wallet connection complete');
            
            // Prompt for username if not set
            const currentUsername = get().username;
            if (!currentUsername) {
              console.log('💭 No username found, will prompt user...');
              // Username prompt will be handled by the UI component
            }
          } else {
            throw new Error('No public key received from wallet');
          }
        } catch (error: any) {
          console.error('❌ Wallet connection error in store:', error);
          set({ 
            error: error.message || 'Failed to connect wallet', 
            isConnecting: false,
            isConnected: false
          });
          throw error;
        }
      },

      // Disconnect wallet
      disconnect: () => {
        set({ 
          address: null, 
          provider: null, 
          balances: [], 
          isConnected: false,
          error: null 
        });
      },

      // Switch network with Freighter sync warning
      switchNetwork: async (network: NetworkType) => {
        const { provider } = get();
        
        if (provider === 'freighter') {
          try {
            const freighterNetwork = await getNetwork();
            // Freighter returns {network: 'TESTNET' | 'PUBLIC', networkPassphrase: '...'}
            const networkValue = typeof freighterNetwork === 'string' 
              ? freighterNetwork 
              : freighterNetwork.network || freighterNetwork;
            const freighterAppNetwork = networkValue === 'TESTNET' ? 'testnet' : 'mainnet';
            
            if (freighterAppNetwork !== network) {
              console.warn('⚠️ Network mismatch detected:', {
                appNetwork: network,
                freighterNetwork: freighterAppNetwork
              });
              // Still allow the switch but warn user
            }
          } catch (error) {
            console.warn('Could not check Freighter network:', error);
          }
        }
        
        set({ network, balances: [] });
        // Refetch balances for new network
        const { address } = get();
        if (address) {
          get().fetchBalances();
        }
      },

      // Fetch balances
      fetchBalances: async () => {
        const { address, network } = get();
        if (!address) return;

        try {
          const server = new StellarSdk.Horizon.Server(
            network === 'mainnet' 
              ? 'https://horizon.stellar.org'
              : 'https://horizon-testnet.stellar.org'
          );

          const account = await server.loadAccount(address);
          const balances: WalletBalance[] = account.balances.map((balance: any) => ({
            asset_code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
            asset_issuer: balance.asset_issuer,
            balance: balance.balance,
            limit: balance.limit,
            buying_liabilities: balance.buying_liabilities,
            selling_liabilities: balance.selling_liabilities,
          }));

          console.log('💰 Fetched balances:', balances.map(b => `${b.asset_code}: ${b.balance}`));
          set({ balances });
        } catch (error: any) {
          console.error('Error fetching balances:', error);
          set({ error: 'Failed to fetch balances' });
        }
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Sign transaction with network validation
      signTransaction: async (transactionXDR: string) => {
        const { provider, network } = get();
        
        if (!provider) {
          throw new Error('No wallet connected');
        }

        // Validate network match for Freighter
        if (provider === 'freighter') {
          console.log('🖊️ Freighter signing on network:', network);
          // Skip network validation to avoid mismatch errors
        }

        try {
          let signedXDR: string;

          if (provider === 'freighter') {
            const networkName = network === 'testnet' ? 'TESTNET' : 'PUBLIC';
            const networkPassphrase = network === 'testnet' 
              ? StellarSdk.Networks.TESTNET 
              : StellarSdk.Networks.PUBLIC;
              
            console.log('🔒 CRITICAL: Freighter signing request:', {
              appNetwork: network,
              freighterNetworkParam: networkName,
              freighterPassphrase: networkPassphrase.slice(0, 30) + '...',
              expectedResult: 'Transaction should execute on ' + networkName
            });
            
            try {
              const result = await freighterSignTransaction(transactionXDR, {
                network: networkName,
                networkPassphrase: networkPassphrase,  // ← CRITICAL FIX: Add passphrase!
              });
              
              if (result.error) {
                console.error('Freighter signing error:', result.error);
                // Properly extract error message from result.error
                const errorMsg = typeof result.error === 'string' 
                  ? result.error 
                  : result.error.message || JSON.stringify(result.error);
                
                // Check for insufficient funds error
                if (errorMsg.includes('INSUFFICIENT FUNDS') || errorMsg.includes('insufficient')) {
                  throw new Error('Insufficient funds. Make sure Freighter wallet is set to TESTNET (not MAINNET). You have funds on TestNet but Freighter might be on MainNet.');
                }
                
                throw new Error(errorMsg);
              }
              
              signedXDR = result.signedTxXdr;
              console.log('✅ Freighter signing successful');
            } catch (freighterError: any) {
              console.error('❌ Freighter signing exception:', freighterError);
              
              // Extract meaningful error message
              let errorMessage = 'Unknown Freighter error';
              
              if (typeof freighterError === 'string') {
                errorMessage = freighterError;
              } else if (freighterError.message) {
                errorMessage = freighterError.message;
              } else if (freighterError.error) {
                errorMessage = typeof freighterError.error === 'string' ? freighterError.error : JSON.stringify(freighterError.error);
              } else {
                errorMessage = JSON.stringify(freighterError);
              }
              
              // Handle specific error types
              if (errorMessage.includes('INSUFFICIENT FUNDS') || errorMessage.includes('insufficient funds')) {
                throw new Error('🚫 Insufficient funds error detected. Your Freighter wallet is likely set to MAINNET. Please switch Freighter to TESTNET: Click Freighter extension → Network dropdown (top) → Select "TESTNET"');
              } else if (errorMessage.includes('SSL certificate') || errorMessage.includes('not secure')) {
                throw new Error('Freighter requires HTTPS. Please enable "Allow connections to domains without SSL" in Freighter Settings > Security > Advanced settings, then try again.');
              } else if (errorMessage.includes('User declined') || errorMessage.includes('rejected')) {
                throw new Error('Transaction rejected by user');
              } else {
                throw new Error(errorMessage);
              }
            }
          } else if (provider === 'albedo') {
            if (!window.albedo) {
              throw new Error('Albedo wallet not available');
            }
            const result = await window.albedo.tx({ xdr: transactionXDR });
            signedXDR = result.signed_envelope_xdr;
          } else if (provider === 'rabet') {
            if (!window.rabet) {
              throw new Error('Rabet wallet not available');
            }
            const result = await window.rabet.sign(transactionXDR);
            signedXDR = result.xdr;
          } else {
            throw new Error('Unsupported wallet provider');
          }

          return signedXDR;
        } catch (error) {
          console.error('❌ Transaction signing failed:', error);
          
          // Handle specific error types
          if (error.message?.includes('Network mismatch')) {
            throw error; // Re-throw network mismatch errors
          } else if (error.message?.includes('User declined') || error.message?.includes('rejected')) {
            throw new Error('Transaction rejected by user');
          } else if (error.message?.includes('Freighter signing failed')) {
            throw error; // Re-throw Freighter-specific errors
          } else {
            throw new Error(`Failed to sign transaction: ${error.message || 'Unknown signing error'}`);
          }
        }
      },

      // Manually sync with Freighter network
      syncWithFreighter: async () => {
        const { provider } = get();
        
        if (provider !== 'freighter') {
          console.log('Not using Freighter, skipping network sync');
          return;
        }
        
        try {
          console.log('🔄 Checking Freighter network...');
          const freighterNetwork = await getNetwork();
          console.log('📡 Raw Freighter network response:', freighterNetwork);
          
          // Freighter returns an object: {network: 'TESTNET' | 'PUBLIC', networkPassphrase: '...'}
          const networkValue = typeof freighterNetwork === 'string' 
            ? freighterNetwork 
            : freighterNetwork.network || freighterNetwork;
          
          const appNetwork = networkValue === 'TESTNET' ? 'testnet' : 'mainnet';
          const currentNetwork = get().network;
          
          console.log('🔄 Network sync analysis:', {
            rawFreighterResponse: freighterNetwork,
            interpretedFreighterNetwork: appNetwork,
            currentAppNetwork: currentNetwork,
            needsSync: currentNetwork !== appNetwork,
            timestamp: new Date().toISOString()
          });
          
          // Always sync to match Freighter, even if it seems the same
          console.log(`🔄 Force network sync: ${currentNetwork} → ${appNetwork}`);
          set({ network: appNetwork, balances: [] });
          
          // Refetch balances for new network
          const { address } = get();
          if (address) {
            console.log('🔄 Refetching balances for network:', appNetwork);
            get().fetchBalances();
          }
          
          console.log('✅ Network sync completed:', appNetwork);
          
          return appNetwork;
        } catch (error) {
          console.error('Failed to sync with Freighter network:', error);
          throw new Error(`Could not sync with Freighter network: ${error.message}`);
        }
      },

      // Set username
      setUsername: (name: string) => {
        set({ username: name });
        console.log('✅ Username saved:', name);
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        address: state.address,
        provider: state.provider,
        network: state.network,
        username: state.username,
      }),
    }
  )
);