#!/bin/bash

# StarkShoot Stellar Smart Contract Deployment Script
# Make this file executable: chmod +x deploy.sh

set -e

echo "🚀 StarkShoot Stellar Contract Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo -e "${RED}Error: Soroban CLI not found${NC}"
    echo "Install it with: cargo install --locked soroban-cli --features opt"
    exit 1
fi

# Step 1: Build the contract
echo -e "\n${YELLOW}Step 1: Building contract...${NC}"
soroban contract build

if [ ! -f "target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm" ]; then
    echo -e "${RED}Error: WASM file not found after build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contract built successfully${NC}"

# Step 2: Configure network (if not already configured)
echo -e "\n${YELLOW}Step 2: Configuring Stellar Testnet...${NC}"
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || echo "Network already configured"

echo -e "${GREEN}✓ Network configured${NC}"

# Step 3: Generate or use existing deployer identity
echo -e "\n${YELLOW}Step 3: Setting up deployer identity...${NC}"
if ! soroban keys ls 2>/dev/null | grep -q "starkshoot-deployer"; then
    echo "Generating new deployer identity..."
    soroban keys generate starkshoot-deployer --network testnet
    echo -e "${GREEN}✓ New identity generated${NC}"
else
    echo -e "${GREEN}✓ Using existing identity${NC}"
fi

# Step 4: Fund the account
echo -e "\n${YELLOW}Step 4: Funding deployer account...${NC}"
soroban keys fund starkshoot-deployer --network testnet
echo -e "${GREEN}✓ Account funded${NC}"

# Get deployer address
DEPLOYER_ADDRESS=$(soroban keys address starkshoot-deployer)
echo -e "Deployer address: ${GREEN}$DEPLOYER_ADDRESS${NC}"

# Step 5: Deploy the contract
echo -e "\n${YELLOW}Step 5: Deploying contract to testnet...${NC}"
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/starkshoot_staking_contract.wasm \
  --source starkshoot-deployer \
  --network testnet)

echo -e "${GREEN}✓ Contract deployed successfully!${NC}"
echo -e "Contract ID: ${GREEN}$CONTRACT_ID${NC}"

# Step 6: Initialize the contract
echo -e "\n${YELLOW}Step 6: Initializing contract...${NC}"
STAKE_AMOUNT="100000000"  # 10 XLM in stroops

soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  initialize \
  --admin $DEPLOYER_ADDRESS \
  --stake_amount $STAKE_AMOUNT

echo -e "${GREEN}✓ Contract initialized${NC}"

# Step 7: Verify deployment
echo -e "\n${YELLOW}Step 7: Verifying deployment...${NC}"
RETURNED_STAKE=$(soroban contract invoke \
  --id $CONTRACT_ID \
  --source starkshoot-deployer \
  --network testnet \
  -- \
  get_stake_amount)

echo -e "Stake amount set to: ${GREEN}$RETURNED_STAKE stroops${NC}"

# Save contract details
echo -e "\n${YELLOW}Saving contract details...${NC}"
cat > contract-details.txt << EOF
StarkShoot Stellar Smart Contract
==================================

Deployment Date: $(date)
Network: Testnet
Contract ID: $CONTRACT_ID
Admin Address: $DEPLOYER_ADDRESS
Stake Amount: $STAKE_AMOUNT stroops (10 XLM)

RPC URL: https://soroban-testnet.stellar.org:443
Network Passphrase: Test SDF Network ; September 2015

Commands:
---------
# Get stake amount
soroban contract invoke --id $CONTRACT_ID --source starkshoot-deployer --network testnet -- get_stake_amount

# Get admin
soroban contract invoke --id $CONTRACT_ID --source starkshoot-deployer --network testnet -- get_admin

# Check if player has staked
soroban contract invoke --id $CONTRACT_ID --source starkshoot-deployer --network testnet -- has_staked --player <PLAYER_ADDRESS>

# Get game match
soroban contract invoke --id $CONTRACT_ID --source starkshoot-deployer --network testnet -- get_game_match --game_id <GAME_ID>
EOF

echo -e "${GREEN}✓ Contract details saved to contract-details.txt${NC}"

# Create .env file for frontend
echo -e "\n${YELLOW}Creating .env file for frontend...${NC}"
cat > ../contract.env << EOF
# Stellar Smart Contract Configuration
VITE_STELLAR_CONTRACT_ID=$CONTRACT_ID
VITE_STELLAR_ADMIN_ADDRESS=$DEPLOYER_ADDRESS
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_STAKE_AMOUNT=$STAKE_AMOUNT
EOF

echo -e "${GREEN}✓ Contract configuration saved to ../contract.env${NC}"

echo -e "\n${GREEN}=========================================="
echo -e "🎉 Deployment Complete!"
echo -e "==========================================${NC}"
echo -e "\nContract ID: ${GREEN}$CONTRACT_ID${NC}"
echo -e "\nNext steps:"
echo -e "1. Copy contract.env variables to your .env file"
echo -e "2. Install Stellar SDK: ${YELLOW}npm install @stellar/stellar-sdk${NC}"
echo -e "3. Update your frontend to use the Stellar integration"
echo -e "\nFor mainnet deployment, change network to 'mainnet' in the script"
