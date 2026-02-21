# 🚀 Step-by-Step Stellar Contract Deployment Guide

## Complete Deployment Process with Wallet Setup

---

## 📋 Prerequisites Installation

### Step 1: Install Rust
```bash
# Download and install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts (press 1 for default installation)
# Then reload your shell
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### Step 2: Add WebAssembly Target
```bash
rustup target add wasm32-unknown-unknown

# Verify it was added
rustup target list | grep wasm32
```

### Step 3: Install Soroban CLI
```bash
cargo install --locked soroban-cli --features opt

# This will take 5-10 minutes
# Verify installation
soroban --version
```

---

## 🔑 Wallet Setup (Choose One Option)

### **Option A: Generate New Wallet (Recommended for Testing)**

This creates a new Stellar wallet automatically:

```bash
cd stellar-contract

# Generate new identity
soroban keys generate starkshoot-deployer --network testnet

# Get your new address
soroban keys address starkshoot-deployer
```

**Output:**
```
Generated identity: starkshoot-deployer
Address: GBCD...XYZ (your public address)
```

**Where is it saved?**
- Location: `~/.config/soroban/identity/starkshoot-deployer.toml`
- Contains: Your secret key (keep this safe!)

---

### **Option B: Import Existing Stellar Wallet**

If you already have a Stellar wallet (from Freighter, Lobstr, etc.):

#### B1: Get Your Secret Key

**From Freighter Wallet:**
1. Open Freighter browser extension
2. Click Settings → View Secret Key
3. Copy your secret key (starts with `S...`)

**From Lobstr:**
1. Settings → Security → View Secret Key
2. Copy your secret key

**From Stellar Laboratory:**
1. Go to https://laboratory.stellar.org/#account-creator?network=test
2. Generate keypair
3. Copy secret key

#### B2: Import Secret Key to Soroban

```bash
cd stellar-contract

# Method 1: Import with command (RECOMMENDED)
soroban keys add starkshoot-deployer --secret-key

# It will prompt: "Enter secret key:"
# Paste your secret key (starts with S...)
# Press Enter

# Verify it worked
soroban keys address starkshoot-deployer
```

**Alternative Method 2: Manual file creation**
```bash
# Create identity file manually
mkdir -p ~/.config/soroban/identity

# Create file with your secret key
cat > ~/.config/soroban/identity/starkshoot-deployer.toml << EOF
secret_key = "YOUR_SECRET_KEY_HERE"
EOF

# Replace YOUR_SECRET_KEY_HERE with your actual secret key

# Verify
soroban keys address starkshoot-deployer
```

---

## 💰 Fund Your Wallet

### Get Testnet XLM (Free for Testing)

```bash
# Fund your account with testnet XLM
soroban keys fund starkshoot-deployer --network testnet

# This gives you 10,000 testnet XLM for free
```

**Output:**
```
Funding account GBCD...XYZ on network testnet
Account funded successfully
```

### Check Your Balance

```bash
# Check balance
soroban keys balance starkshoot-deployer --network testnet
```

**Output:**
```
Balance: 10000.0000000 XLM
```

---

## 🏗️ Build the Contract

### Step 4: Navigate and Build

```bash
# Make sure you're in the contract directory
cd stellar-contract   # or /Users/kiran/Desktop/StarkShootRoR/stellar-contract

# Build the contract
soroban contract build
```

**This will:**
- Compile Rust code to WebAssembly
- Create `.wasm` file in `target/wasm32-unknown-unknown/release/`
- Take 2-3 minutes first time

**Expected Output:**
```
   Compiling starkshoot-staking-contract v0.1.0
    Finished release [optimized] target(s) in 2m 15s
```

**Verify Build:**
```bash
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

You should see:
```
starkshoot_staking_contract.wasm
```

---

## 🌐 Configure Network

### Step 5: Add Stellar Testnet

```bash
# Add testnet network configuration
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

**Output:**
```
Network 'testnet' added successfully
```

**Verify Network:**
```bash
soroban network ls
```

---

## 🚀 Deploy the Contract

### Step 6: Deploy to Testnet

```bash
# Deploy the contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm \
  --source starkshoot-deployer \
  --network testnet
```

**This takes 10-30 seconds**

**Output:**
```
Deploying contract...
Contract deployed successfully!
Contract ID: CDQN4RZWHSEXA3GZLF2FPI7PQ5KTSO3OY7AMVLWC5QBTVXCFV6XYZ
```

**🎯 SAVE THIS CONTRACT ID! You need it for everything!**

```bash
# Save it to environment variable
export CONTRACT_ID="CDQN4RZWHSEXA3GZLF2FPI7PQ5KTSO3OY7AMVLWC5QBTVXCFV6XYZ"

# Or save to file
echo "CDQN4RZWHSEXA3GZLF2FPI7PQ5KTSO3OY7AMVLWC5QBTVXCFV6XYZ" > contract_id.txt
```

---

## ⚙️ Initialize the Contract

### Step 7: Set Initial Configuration

```bash
# Get your admin address
export ADMIN_ADDRESS=$(soroban keys address starkshoot-deployer)

# Set stake amount (10 XLM = 100,000,000 stroops)
export STAKE_AMOUNT="100000000"

# Initialize the contract
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  initialize \
  --admin $ADMIN_ADDRESS \
  --stake_amount $STAKE_AMOUNT
```

**Output:**
```
Simulating transaction...
Transaction successful
```

---

## ✅ Verify Deployment

### Step 8: Test Contract Functions

```bash
# Test 1: Get stake amount
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_stake_amount
```
**Expected:** `100000000`

```bash
# Test 2: Get admin address
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_admin
```
**Expected:** Your admin address

```bash
# Test 3: Check if player has staked (should be false)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  has_staked \
  --player $ADMIN_ADDRESS
```
**Expected:** `false`

---

## 📝 Save Configuration

### Step 9: Create Configuration Files

```bash
# Save contract details
cat > contract-details.txt << EOF
StarkShoot Smart Contract Deployment
=====================================

Deployed: $(date)
Network: Testnet
Contract ID: $CONTRACT_ID
Admin Address: $ADMIN_ADDRESS
Stake Amount: $STAKE_AMOUNT stroops (10 XLM)

Identity File: ~/.config/soroban/identity/starkshoot-deployer.toml
WASM File: target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm

RPC URL: https://soroban-testnet.stellar.org:443
Network Passphrase: Test SDF Network ; September 2015
EOF

cat contract-details.txt
```

### Step 10: Create Frontend Environment Variables

```bash
# Create .env file for your React app
cat > ../contract.env << EOF
# Stellar Smart Contract Configuration
VITE_STELLAR_CONTRACT_ID=$CONTRACT_ID
VITE_STELLAR_ADMIN_ADDRESS=$ADMIN_ADDRESS
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_STAKE_AMOUNT=$STAKE_AMOUNT
EOF

echo "✅ Created contract.env"
cat ../contract.env
```

---

## 🔐 Important Security Notes

### Your Wallet Files

**Location of your secret key:**
```bash
~/.config/soroban/identity/starkshoot-deployer.toml
```

**To view your secret key:**
```bash
cat ~/.config/soroban/identity/starkshoot-deployer.toml
```

**⚠️ NEVER:**
- Commit this file to Git
- Share your secret key
- Use testnet keys on mainnet with real money

**✅ DO:**
- Back up your secret key securely
- Use hardware wallet for mainnet
- Keep testnet and mainnet keys separate

---

## 🎮 Ready for Frontend Integration

### Step 11: Install Frontend Dependencies

```bash
cd ..  # Back to main project
npm install @stellar/stellar-sdk ipfs-http-client
```

### Step 12: Copy Environment Variables

```bash
# Add contract config to your main .env
cat contract.env >> .env

# Or manually add to .env file
nano .env  # or use your editor
```

---

## 🧪 Testing Contract Interactions

### Test Staking Flow (with Token)

You need a token address for actual staking. For testing:

```bash
# Use testnet USDC
export TOKEN_ADDRESS="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

# Test stake to play (Game ID 1)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  stake_to_play \
  --player $ADMIN_ADDRESS \
  --token_address $TOKEN_ADDRESS \
  --game_id 1
```

### Test Winner Declaration

```bash
# Declare winner (requires game with staked players)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  declare_winner \
  --admin $ADMIN_ADDRESS \
  --game_id 1 \
  --winner $ADMIN_ADDRESS \
  --ipfs_hash "QmTestHash123..." \
  --token_address $TOKEN_ADDRESS
```

---

## 🔄 Automated Deployment Script

If you prefer automation:

```bash
# Use the provided script
chmod +x deploy.sh
./deploy.sh
```

This script does all steps automatically!

---

## 🌍 Mainnet Deployment (Production)

### When Ready for Real Money:

1. **Change network configuration:**
```bash
soroban network add \
  --global mainnet \
  --rpc-url https://soroban-mainnet.stellar.org:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"
```

2. **Use mainnet identity:**
```bash
soroban keys generate starkshoot-mainnet --network mainnet
# Or import your mainnet wallet
```

3. **Fund with REAL XLM:**
- Buy XLM on exchange
- Send to your wallet address
- Minimum 100 XLM recommended for deployment

4. **Deploy to mainnet:**
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm \
  --source starkshoot-mainnet \
  --network mainnet
```

---

## 🆘 Troubleshooting

### "soroban: command not found"
```bash
# Reinstall
cargo install --locked soroban-cli --features opt

# Add to PATH
export PATH="$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Network error"
```bash
# Check network status
curl https://soroban-testnet.stellar.org:443/health

# Should return: {"status":"healthy"}
```

### "Insufficient balance"
```bash
# Request more testnet XLM
soroban keys fund starkshoot-deployer --network testnet

# Can request multiple times if needed
```

### "Build failed"
```bash
# Clean and rebuild
cargo clean
soroban contract build

# Update Rust
rustup update
```

### "Can't find identity"
```bash
# List all identities
soroban keys ls

# Show identity address
soroban keys address starkshoot-deployer

# If missing, regenerate
soroban keys generate starkshoot-deployer --network testnet
```

---

## 📊 Summary Checklist

- [ ] Rust installed
- [ ] WebAssembly target added
- [ ] Soroban CLI installed
- [ ] Wallet created/imported
- [ ] Account funded with testnet XLM
- [ ] Contract built successfully
- [ ] Network configured
- [ ] Contract deployed (CONTRACT_ID saved)
- [ ] Contract initialized
- [ ] Verified with test calls
- [ ] Configuration saved
- [ ] Frontend .env updated

---

## 🎯 Next Steps

1. **Integrate with Frontend:**
   - Use `src/services/stellarContract.ts`
   - Update Navbar for Stellar wallet
   - Add staking in Lobby
   - Add winner declaration in Result

2. **Get Token:**
   - Use testnet USDC or
   - Deploy your own token contract

3. **Test Full Flow:**
   - Connect wallet
   - Stake to play
   - Play game
   - Declare winner
   - Verify rewards

---

## 📞 Support Resources

- **Stellar Discord**: https://discord.gg/stellardev
- **Soroban Docs**: https://soroban.stellar.org/docs
- **Stack Exchange**: https://stellar.stackexchange.com/
- **GitHub Issues**: Report contract bugs

---

**🎉 Congratulations! Your smart contract is deployed and ready!**

Your CONTRACT_ID: `$CONTRACT_ID`
Your Admin Address: `$ADMIN_ADDRESS`

Save these values - you'll need them for your frontend integration!
