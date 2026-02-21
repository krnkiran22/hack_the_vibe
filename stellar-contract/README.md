# StarkShoot Stellar Smart Contract

This directory contains the Stellar/Soroban smart contract for StarkShoot's staking and rewards system.

## Quick Start

### Prerequisites
- Rust installed
- Soroban CLI installed
- WebAssembly target

### Deploy in One Command
```bash
chmod +x deploy.sh
./deploy.sh
```

This will build, deploy, and initialize the contract on Stellar testnet.

## What This Contract Does

### Core Features
1. **Staking System**: Players stake tokens to enter games
2. **Prize Pool Management**: Automatic collection and distribution
3. **Winner Declaration**: Admin declares winner after game ends
4. **Rewards Distribution**: 95% to winner, 5% platform fee
5. **IPFS Storage**: Game replay data stored on-chain reference

### Contract Functions

| Function | Purpose | Who Can Call |
|----------|---------|--------------|
| `initialize()` | Setup contract | Anyone (once) |
| `stake_to_play()` | Enter game with stake | Players |
| `declare_winner()` | End game, pay rewards | Admin only |
| `get_game_match()` | View game details | Anyone |
| `has_staked()` | Check stake status | Anyone |
| `get_stake_amount()` | View stake requirement | Anyone |
| `update_stake_amount()` | Change stakes | Admin only |

## File Structure

```
stellar-contract/
├── Cargo.toml                    # Rust dependencies
├── src/
│   ├── lib.rs                    # Main contract code
│   └── test.rs                   # Unit tests
├── deploy.sh                     # Automated deployment script
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README.md                     # This file
```

## Development

### Build
```bash
soroban contract build
```

### Test
```bash
cargo test
```

### Deploy to Testnet
```bash
./deploy.sh
```

### Deploy to Mainnet
Edit `deploy.sh` and change all `testnet` to `mainnet`, then run it.

## Integration

After deployment:

1. Copy `contract.env` to main project root as `.env`
2. Install Stellar SDK in main project:
   ```bash
   cd ..
   npm install @stellar/stellar-sdk
   ```
3. Use the service in `/src/services/stellarContract.ts`

## Token Requirements

This contract requires a Stellar token for staking. Options:

1. **Native XLM** - Use wrapped XLM via Stellar Asset Contract
2. **USDC** - Use Stellar USDC (testnet or mainnet)
3. **Custom Token** - Deploy your own token contract

### Testnet USDC
```
Address: CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

## Security

⚠️ **Important**:
- Never commit private keys
- Use hardware wallets for mainnet admin keys
- Audit contract before mainnet deployment
- Test thoroughly on testnet first

## Support

- Stellar Discord: https://discord.gg/stellardev
- Soroban Docs: https://soroban.stellar.org/docs

## License

See project root LICENSE file.
