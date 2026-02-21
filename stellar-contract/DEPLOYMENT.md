# StarkShoot Stellar Smart Contract Deployment Guide

## Prerequisites

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Add WebAssembly Target
```bash
rustup target add wasm32-unknown-unknown
```

### 3. Install Soroban CLI
```bash
cargo install --locked soroban-cli --features opt
```

Verify installation:
```bash
soroban --version
```

## Quick Deployment (Automated)

### 1. Make the deployment script executable
```bash
cd stellar-contract
chmod +x deploy.sh
```

### 2. Run the deployment script
```bash
./deploy.sh
```

The script will:
- Build the contract
- Configure Stellar testnet
- Generate/use deployer identity
- Fund the account
- Deploy the contract
- Initialize with default settings
- Save contract details

## Manual Deployment (Step by Step)

### Step 1: Build the Contract
```bash
cd stellar-contract
soroban contract build
```

This creates: `target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm`

### Step 2: Configure Stellar Testnet
```bash
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Step 3: Generate Deployer Identity
```bash
soroban keys generate starkshoot-deployer --network testnet
```

Get your address:
```bash
soroban keys address starkshoot-deployer
```

### Step 4: Fund Your Account
```bash
soroban keys fund starkshoot-deployer --network testnet
```

Check balance:
```bash
soroban keys balance starkshoot-deployer --network testnet
```

### Step 5: Deploy the Contract
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm \
  --source starkshoot-deployer \
  --network testnet
```

**Save the CONTRACT_ID from output!**

### Step 6: Initialize the Contract
```bash
# Set your contract ID
export CONTRACT_ID="<YOUR_CONTRACT_ID_HERE>"

# Get admin address
export ADMIN_ADDRESS=$(soroban keys address starkshoot-deployer)

# Set stake amount (10 XLM = 100000000 stroops)
export STAKE_AMOUNT="100000000"

# Initialize
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  initialize \
  --admin $ADMIN_ADDRESS \
  --stake_amount $STAKE_AMOUNT
```

## Testing Contract Functions

### Get Stake Amount
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_stake_amount
```

### Get Admin Address
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_admin
```

### Check if Player Staked
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  has_staked \
  --player <PLAYER_ADDRESS>
```

### Stake to Play (requires token)
```bash
export GAME_ID="1"
export TOKEN_ADDRESS="<YOUR_TOKEN_ADDRESS>"

soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  stake_to_play \
  --player $ADMIN_ADDRESS \
  --token_address $TOKEN_ADDRESS \
  --game_id $GAME_ID
```

### Get Game Match Details
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_game_match \
  --game_id 1
```

### Declare Winner
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  declare_winner \
  --admin $ADMIN_ADDRESS \
  --game_id 1 \
  --winner <WINNER_ADDRESS> \
  --ipfs_hash "QmYourIPFSHash..." \
  --token_address $TOKEN_ADDRESS
```

## Mainnet Deployment

### 1. Configure Mainnet Network
```bash
soroban network add \
  --global mainnet \
  --rpc-url https://soroban-mainnet.stellar.org:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"
```

### 2. Generate Mainnet Identity
```bash
soroban keys generate starkshoot-mainnet --network mainnet
```

### 3. Fund with Real XLM
Transfer XLM to your mainnet address from an exchange or wallet.

### 4. Deploy to Mainnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm \
  --source starkshoot-mainnet \
  --network mainnet
```

### 5. Initialize on Mainnet
```bash
export MAINNET_CONTRACT_ID="<YOUR_MAINNET_CONTRACT_ID>"
export MAINNET_ADMIN=$(soroban keys address starkshoot-mainnet)

soroban contract invoke \
  --id $MAINNET_CONTRACT_ID \
  --source starkshoot-mainnet \
  --network mainnet \
  -- \
  initialize \
  --admin $MAINNET_ADMIN \
  --stake_amount 100000000
```

## Token Setup

### Option 1: Use Native XLM (Wrapped)
Deploy a token wrapper contract or use Stellar's native XLM with SAC (Stellar Asset Contract).

### Option 2: Deploy Custom Token
Use Soroban's token interface to deploy your own game token.

### Option 3: Use Existing USDC
```bash
# Testnet USDC address
export TOKEN_ADDRESS="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
```

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cargo clean
soroban contract build
```

### Network Connection Issues
```bash
# Test connection
curl https://soroban-testnet.stellar.org:443/health
```

### Insufficient Balance
```bash
# Request more testnet tokens
soroban keys fund starkshoot-deployer --network testnet
```

### Contract Not Found
```bash
# Verify contract ID
soroban contract info id $CONTRACT_ID --network testnet
```

## Security Best Practices

1. **Mainnet Keys**: Never commit mainnet keys to version control
2. **Admin Access**: Store admin keys securely (hardware wallet recommended)
3. **Audit**: Get contract audited before mainnet deployment
4. **Testing**: Thoroughly test on testnet before mainnet
5. **Upgrades**: Plan for contract upgrade mechanism if needed

## Contract Functions Summary

| Function | Description | Auth Required |
|----------|-------------|---------------|
| `initialize` | Set admin and stake amount | No (one-time) |
| `stake_to_play` | Player stakes tokens | Player |
| `declare_winner` | Distribute rewards | Admin |
| `get_game_match` | Get game details | No |
| `has_staked` | Check if player staked | No |
| `get_player_game` | Get player's game ID | No |
| `get_stake_amount` | Get stake requirement | No |
| `update_stake_amount` | Change stake amount | Admin |
| `get_admin` | Get admin address | No |

## Next Steps After Deployment

1. Update frontend `.env` with contract ID
2. Install Stellar SDK: `npm install @stellar/stellar-sdk`
3. Implement frontend integration (see `/src/services/stellarContract.ts`)
4. Test staking flow
5. Test winner declaration
6. Deploy frontend to production

## Support

- Stellar Discord: https://discord.gg/stellardev
- Soroban Docs: https://soroban.stellar.org/docs
- Stellar Stack Exchange: https://stellar.stackexchange.com/
