# 🚀 StarkShoot Stellar Smart Contract - Quick Deployment

## ⚡ Deploy in 3 Steps

### Step 1: Install Prerequisites
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli --features opt
```

### Step 2: Deploy Contract
```bash
cd stellar-contract
./deploy.sh
```

### Step 3: Configure Frontend
```bash
# Copy the generated contract.env to your main .env file
cat contract.env >> ../.env

# Install Stellar SDK
cd ..
npm install @stellar/stellar-sdk ipfs-http-client
```

---

## 📋 What Gets Deployed

The script automatically:
- ✅ Builds the Rust smart contract
- ✅ Configures Stellar testnet
- ✅ Generates deployer identity (or uses existing)
- ✅ Funds account with testnet XLM
- ✅ Deploys contract to testnet
- ✅ Initializes with default stake (10 XLM)
- ✅ Saves contract ID and details
- ✅ Creates `.env` configuration for frontend

---

## 📝 After Deployment

You'll get:
- **Contract ID**: Saved in `contract-details.txt`
- **Admin Address**: Your deployer address
- **Config File**: `contract.env` with all variables
- **Stake Amount**: Default 10 XLM (100,000,000 stroops)

Example output:
```
Contract ID: CDQN...XYZ
Admin Address: GBCD...ABC
Stake Amount: 100000000 stroops
```

---

## 🔗 Environment Variables Added

After running deploy script, these will be in `contract.env`:

```bash
VITE_STELLAR_CONTRACT_ID=<your_contract_id>
VITE_STELLAR_ADMIN_ADDRESS=<your_admin_address>
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_STAKE_AMOUNT=100000000
```

---

## 🧪 Test Your Deployment

```bash
# Check stake amount
soroban contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_stake_amount

# Check admin
soroban contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_admin
```

---

## 🔄 Next Steps - Frontend Integration

### 1. Update Package Dependencies
Already done if you ran Step 3, or run:
```bash
npm install @stellar/stellar-sdk ipfs-http-client
```

### 2. Import Stellar Service
In your React components:
```typescript
import stellarContract from '@/services/stellarContract';
```

### 3. Get Stake Amount
```typescript
const stakeAmount = await stellarContract.getStakeAmount();
console.log(`Stake required: ${stellarContract.stroopsToXLM(stakeAmount)} XLM`);
```

### 4. Check if Player Staked
```typescript
const hasStaked = await stellarContract.hasPlayerStaked(playerAddress);
```

### 5. Player Stakes to Enter Game
```typescript
const result = await stellarContract.stakeToPlay(
  playerSecretKey,
  gameId,
  tokenAddress
);

if (result.success) {
  console.log('Staked successfully!', result.hash);
} else {
  console.error('Stake failed:', result.error);
}
```

### 6. Admin Declares Winner
```typescript
// Upload game data to IPFS first
const ipfsHash = await stellarContract.uploadGameDataToIPFS(gameData);

// Declare winner
const result = await stellarContract.declareWinner(
  adminSecretKey,
  gameId,
  winnerAddress,
  ipfsHash,
  tokenAddress
);

if (result.success) {
  console.log('Winner declared!', result.hash);
}
```

---

## 🎮 Integration with Game Flow

### Current Flow
```
Home → Lobby → Game → Result
```

### New Flow with Staking
```
Home → Connect Wallet → Lobby → Stake → Game → Result (Winner Declared)
```

### Component Updates Needed

**1. Lobby.jsx**
- Show stake amount required
- Add "Stake to Play" button
- Disable "Play" until stake confirmed

**2. Result.jsx**
- Admin declares winner (MVP)
- Upload game data to IPFS
- Trigger reward distribution

**3. Navbar.jsx**
- Replace Starknet with Stellar wallet connection
- Use Freighter wallet (Stellar's MetaMask)

---

## 🪙 Token Setup

You need a Stellar token for staking. Options:

### Option 1: Testnet USDC (Easiest)
```bash
export TOKEN_ADDRESS="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
```

### Option 2: Native XLM (via Stellar Asset Contract)
Use wrapped XLM through SAC

### Option 3: Custom Token
Deploy your own token contract

---

## 🔒 Security Notes

⚠️ **IMPORTANT**:
- Deployer keys saved in: `~/.config/soroban/identity/starkshoot-deployer.toml`
- **DO NOT COMMIT** this file to git
- For mainnet: Use hardware wallet
- Keep admin keys secure

---

## 🌐 Mainnet Deployment

When ready for production:

1. Edit `deploy.sh`:
   - Change `testnet` to `mainnet`
   - Update RPC URL to mainnet
   - Update network passphrase

2. Fund mainnet account with real XLM

3. Run deployment:
```bash
./deploy.sh
```

---

## 📚 Documentation

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Contract README: [README.md](./README.md)
- Soroban Docs: https://soroban.stellar.org/docs
- Stellar Discord: https://discord.gg/stellardev

---

## ❓ Troubleshooting

### "soroban: command not found"
```bash
cargo install --locked soroban-cli --features opt
```

### "Network connection failed"
Check if testnet is up:
```bash
curl https://soroban-testnet.stellar.org:443/health
```

### "Insufficient balance"
Request more testnet XLM:
```bash
soroban keys fund starkshoot-deployer --network testnet
```

### Build errors
```bash
cd stellar-contract
cargo clean
soroban contract build
```

---

## 🎯 Summary

You now have:
- ✅ Deployed smart contract on Stellar testnet
- ✅ Contract functions for staking and rewards
- ✅ TypeScript service for frontend integration
- ✅ Environment variables configured
- ✅ Ready-to-use deployment scripts

**Contract Features:**
- Players stake 10 XLM to play
- Winner gets 95% of pool
- Platform gets 5% fee
- Game data stored on IPFS
- On-chain verification

Start integrating with your React app using the `stellarContract` service! 🚀
