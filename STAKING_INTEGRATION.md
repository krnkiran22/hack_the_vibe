# 🎮 Stellar Strike - Staking Integration

## Overview
Players use **Freighter wallet** (no secret keys needed) to stake 2 XLM and play games. The smart contract automatically handles prize distribution.

## 🔄 How It Works

### 1. **Player Connects Wallet**
- User clicks "Connect Wallet" in the app
- Freighter browser extension opens
- User approves connection (one-time)
- App now has player's **public address** (not secret key!)

### 2. **Player Stakes to Join Game**
```
User clicks "Create/Join Room"
  ↓
App checks: Do you have 2 XLM + fees?
  ↓
If YES: Build contract transaction
  ↓
Freighter popup asks: "Sign this transaction?"
  ↓
User approves → 2 XLM sent to contract
  ↓
Contract stores: {gameId, player, 2 XLM}
  ↓
Player enters game!
```

**What happens:**
- Contract method: `stake_to_play(player_address, xlm_token, game_id)`
- 2 XLM locked in contract
- Player gets receipt (transaction hash)

### 3. **Game Ends - Winner Gets Prize**
```
Game finishes → Winner determined by kills
  ↓
Game data uploaded to IPFS (proof of results)
  ↓
Backend calls: declare_winner(admin, game_id, winner_address, ipfs_hash)
  ↓
Contract automatically sends:
  - 90% (3.6 XLM) → Winner's wallet
  - 10% (0.4 XLM) → Platform fee
```

## 📋 Contract Details

**Contract Address:**
```
CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS
```

**Admin Address:**
```
GCOMEBNG7L2PNNCCX5E63PF36PIDN6C3AAFEB3O2675B5CG36MECVNGI
```

**Network:** Stellar Testnet

**Stake Amount:** 2 XLM (20000000 stroops)

## 🔐 Security Model

### ✅ What Users DO:
- Connect external Freighter wallet
- Sign transactions in Freighter (they see exactly what they're signing)
- Control their funds (no one else has access)

### ❌ What Users DON'T Do:
- Share secret keys (they never leave Freighter!)
- Trust the website with funds
- Manually send XLM

## 🛠️ Technical Flow

### Staking Transaction
```typescript
// 1. User connects Freighter
const { address } = useWalletStore.getState();

// 2. Build contract call
const contract = new StellarSdk.Contract(CONTRACT_ADDRESS);
const transaction = contract.call(
  'stake_to_play',
  playerAddress,    // User's public address
  xlmTokenAddress,  // Native XLM
  gameId           // Unique game ID
);

// 3. User signs in Freighter (wallet pops up)
const signedTx = await freighterSignTransaction(transaction);

// 4. Submit to Stellar network
const result = await server.submitTransaction(signedTx);

// ✅ Done! User staked 2 XLM
```

### Winner Distribution
```typescript
// Backend calls (requires admin signature):
declareWinner(
  adminKey,        // Your backend's admin key
  gameId,          // Which game
  winnerAddress,   // Winner's public address
  ipfsHash,        // Proof of game results
  xlmTokenAddress  // Payment token
);

// Contract automatically:
// - Verifies admin signature
// - Calculates 90% reward (3.6 XLM)
// - Sends XLM to winner's wallet
// - Keeps 10% platform fee
// - Stores IPFS hash for transparency
```

## 🎯 User Experience

1. **First Time Setup (30 seconds)**
   - Install Freighter extension
   - Create/import wallet
   - Get testnet XLM from friendbot

2. **Every Game (10 seconds)**
   - Connect wallet (if not connected)
   - Click "Create Room"
   - Approve stake in Freighter
   - Play game!

3. **Winning (Automatic!)**
   - Game ends
   - Winner sees: "🏆 You won! 3.6 XLM sent to your wallet"
   - Check Freighter: balance increased!

## 🔗 Integration Points

### Frontend (`gameStaking.ts`)
- ✅ Connects to Freighter wallet
- ✅ Builds contract transactions
- ✅ Gets user signatures via Freighter
- ✅ Submits to Stellar network
- ✅ Tracks game stakes in localStorage

### Contract (`starkshoot-staking-contract`)
- ✅ Holds staked XLM securely
- ✅ Tracks which players staked for which games
- ✅ Distributes winnings automatically
- ✅ Stores game results on IPFS
- ✅ Only admin can declare winners

### Backend (Your Backend Service)
- ⏳ TODO: Monitor game results
- ⏳ TODO: Call `declare_winner` with admin key
- ⏳ TODO: Handle ties/disconnects

## 📊 Example Game Flow

```
Player A connects wallet: GB7X...ABCD (100 XLM balance)
Player B connects wallet: GC9Y...EFGH (100 XLM balance)

Game #12345 created
  ↓
Player A stakes → Contract holds 2 XLM
Player B stakes → Contract holds 4 XLM total
  ↓
Game starts: Both players have 0 kills
  ↓
[Game playing...]
  ↓
Game ends:
  Player A: 5 kills 🎯
  Player B: 2 kills
  ↓
Winner: Player A!
  ↓
Backend calls declare_winner(12345, "GB7X...ABCD", ipfs_hash)
  ↓
Contract sends:
  3.6 XLM → GB7X...ABCD (Player A)
  0.4 XLM → Admin (platform fee)
  ↓
Player A balance: 101.6 XLM (+1.6 profit!)
Player B balance: 98 XLM (-2 loss)
```

## 🚀 Next Steps

### To Complete Integration:

1. **Test Staking in Browser**
   ```bash
   npm run dev
   # Open http://localhost:5173
   # Connect Freighter
   # Try creating a room
   # Check Freighter for transaction approval
   ```

2. **Backend Integration** (Required for winner distribution)
   - Create backend endpoint: `POST /api/game/end`
   - Import admin key from: `~/.config/soroban/identity/starkshoot-deployer.toml`
   - Call contract's `declare_winner` method
   - Example:
     ```javascript
     const adminKey = process.env.STELLAR_ADMIN_SECRET;
     await declareWinner(adminKey, gameId, winnerAddress, ipfsHash, xlmToken);
     ```

3. **Monitor Transactions**
   - Stellar Expert: https://stellar.expert/explorer/testnet
   - Search for your contract ID
   - See all stakes and distributions

## 🔍 Debugging

### Check Contract State
```bash
# See stake amount
soroban contract invoke \
  --id CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS \
  --network testnet \
  -- get_stake_amount

# Check if player staked
soroban contract invoke \
  --id CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS \
  --network testnet \
  -- has_staked --player <PLAYER_ADDRESS>

# Get game info
soroban contract invoke \
  --id CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS \
  --network testnet \
  -- get_game_match --game_id <GAME_ID>
```

### View on Stellar Expert
https://stellar.expert/explorer/testnet/contract/CAAMXUXX5UJME3D7UP2T4XAKVIPOE7LI56KE2WULF5KQ32R6AUOJB2RS

## ✅ Summary

**Users:**
- Use Freighter wallet (external, secure)
- Sign transactions to stake 2 XLM
- Receive winnings automatically to their wallet
- Never share secret keys

**Contract:**
- Holds staked XLM securely
- Distributes prizes to winners
- Stores proof on IPFS
- Fully auditable on blockchain

**Your App:**
- Just facilitates the connection
- Builds proper transaction format
- Lets Freighter handle signatures
- Shows user-friendly messages

**Security:** Users maintain full control of their funds via Freighter! 🔐
