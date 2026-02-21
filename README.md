# 🎮 Hack the Vibe (Competitive AI-Coached Shooter)

**The First Blockchain-Native, AI-Coached Competitive Shooter**

[![Stellar](https://img.shields.io/badge/Stellar-Network-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-brightgreen)](https://soroban.stellar.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Recent Updates](#-recent-updates)
- [Project Description](#-project-description)
- [Contract Address](#-contract-address)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Screenshots](#-screenshots)
- [Deployed Link](#-deployed-link)
- [Demo Video](#-demo-video)
- [Technology Stack](#-technology-stack)
- [Installation & Setup](#-installation--setup)
- [Future Scope & Ecosystem Growth](#-future-scope--ecosystem-growth)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Recent Updates

- **Feb 2026**: Initial prototype migrated to the Hack the Vibe repository.
- **Weapon Rebalancing**: Adjusted AK-47, SMG, and Sniper stats for competitive integrity.
- **HUD Enhancement**: Added real-time mission telemetry and system status indicators.
- **AI Persona**: Fully integrated "Sofia" AI coach with specialized gameplay analysis logic.
- **Security**: Refactored API key management for third-party service integrations (Huddle01).


---

## 🎯 Project Description

**Hack the Vibe** is a high-performance, web-native 3D multiplayer survival shooting game that bridges traditional competitive gaming with the Stellar/Soroban blockchain ecosystem. Built as a feature-rich third-person hero shooter, the game integrates real-time combat mechanics with a decentralized staking economy and an advanced AI-driven gameplay analysis engine.

Players compete in skill-based matches where they stake XLM, battle in immersive 3D arenas, and earn rewards based purely on performance. Every match outcome is recorded on-chain via Soroban smart contracts, ensuring complete transparency and automatic reward distribution. Post-match, our AI agent "Sofia" analyzes gameplay data stored on-chain to provide personalized coaching and tactical insights.

**Key Highlights:**
- 🎮 Real-time PvP combat with multiple game modes (TPP, Knife, Freestyle)
- ⛓️ Transparent stake-to-earn mechanism powered by Soroban smart contracts
- 🤖 AI-driven gameplay analysis and coaching via "Sofia" agent
- 🌐 Cross-platform support (Desktop & Mobile)
- 💰 On-chain settlement with instant reward distribution

---

## 📜 Contract Address

**Soroban Smart Contract (Testnet):**
```
CDQWERTYUIOPASDFGHJKLZXCVBNMQWERTYUIOPASDFGHJKLZXCV
```
*Contract handles match staking, winner declaration, and automated reward distribution*

**Network:** Stellar Testnet (Futurenet)  
**RPC Endpoint:** `https://soroban-testnet.stellar.org`

> 🚀 **Mainnet deployment coming soon**

---

## 💡 Problem Statement

### What We're Solving

The competitive gaming industry faces three critical challenges:

#### 1. **Opaque Reward Systems**
Traditional gaming platforms operate as black boxes. Players have no visibility into prize pool distribution, platform fees are arbitrary, and centralized entities control all financial flows. Disputes over winnings are common, with no transparent mechanism for resolution.

#### 2. **Pay-to-Win Economics**
Modern games increasingly rely on expensive cosmetics and gameplay advantages that favor spending over skill. This creates unfair competitive environments where financial investment trumps player ability, alienating skilled but resource-constrained gamers.

#### 3. **Lack of Actionable Learning Tools**
Players plateau in skill development because they receive no meaningful feedback on their performance. Generic post-match statistics (K/D ratios, accuracy percentages) don't translate into actionable improvement strategies, leaving players frustrated and stagnant.

### How Hack the Vibe Solves This

**Blockchain Transparency:** Every match stake, outcome, and reward distribution is recorded on the Stellar blockchain via Soroban smart contracts. Players can verify all transactions, platform fees are fixed and visible, and disputes are eliminated through immutable on-chain records.

**Skill-Based Competition:** Our staking mechanism ensures only committed players enter matches, while our premium content (characters, maps, weapons) offers variety without competitive advantage. Success is determined purely by gameplay skill, reaction time, and tactical decision-making.

**AI-Powered Improvement:** Sofia, our AI agent, analyzes on-chain gameplay data to provide personalized coaching. Instead of generic stats, players receive specific tactical advice: positioning errors, timing improvements, weapon selection optimization, and strategic recommendations based on their unique playstyle.

**Stellar Network Advantages:** We chose Stellar for its low transaction costs (making micropayments practical), fast settlement times (instant post-match rewards), and robust smart contract capabilities (Soroban), creating a gaming experience that's both competitive and economically accessible.

---

## ✨ Features

### 🎮 Core Gameplay

- **Multiple Game Modes**
  - TPP (Third-Person Perspective): Tactical combat with strategic positioning
  - Knife Only: Intense close-quarters combat
  - Freestyle: No-holds-barred action with all weapons enabled

- **Character System**
  - 8+ unique characters with distinct stats (Accuracy, Stamina, Mobility, Health)
  - Free-to-play characters available from day one
  - Premium characters unlockable with XLM (cosmetic/playstyle variety, not power)

- **Weapon Arsenal**
  - AK-47: High fire rate, moderate damage, spray patterns
  - Sniper Rifle: Precision long-range, high damage, slow fire rate
  - Grenade Launcher: Area control, tactical positioning
  - Each weapon with unique recoil, damage, and range characteristics

- **Dynamic Arenas**
  - Lava World: Volcanic terrain with environmental hazards
  - Pokemon-themed maps: Nostalgic battlegrounds
  - 4 free maps + premium XLM-unlockable arenas

### ⛓️ Blockchain Integration

- **Stake-to-Play Mechanism**
  - Match entry requires XLM staking (10 XLM standard matches)
  - Winner-takes-all with transparent platform fee
  - Instant on-chain settlement via Soroban smart contracts

- **Wallet Support**
  - Freighter Wallet integration for Stellar natives
  - Dynamic multi-chain login for broader accessibility
  - Seamless onboarding for Web2 and Web3 users

- **On-Chain Data Storage**
  - All player movements, actions, and match outcomes stored on Stellar
  - Immutable gameplay records for AI analysis and dispute resolution
  - Transparent leaderboard and ranking systems

### 🤖 Sofia AI Agent

- **Real-Time Gameplay Analysis**
  - Post-match tactical breakdowns
  - Positioning and movement pattern analysis
  - Weapon efficiency and accuracy tracking
  - Strategic recommendations based on opponent behavior

- **Personalized Coaching**
  - Adaptive learning algorithms tracking player improvement
  - Custom training recommendations
  - Meta-strategy updates and weapon balance insights

- **Powered by Advanced AI**
  - LangChain framework for intent routing
  - Groq Llama models for natural language processing
  - Real-time market research capabilities

### 📱 Cross-Platform Experience

- **Desktop Optimized**
  - High-fidelity 3D graphics via Three.js and React Three Fiber
  - Advanced controls with mouse and keyboard
  - Multiple camera angles for tactical advantage

- **Mobile Responsive**
  - Simplified HUD for smaller screens
  - Dedicated mobile leaderboard UI
  - Touch-optimized joystick controls

### 🎤 Social Features

- **Huddle01 Integration**
  - Real-time voice chat during matches
  - Team coordination and strategy discussion
  - Optional trash talk for competitive atmosphere

---

## 🏗️ Architecture Overview

### System Architecture
![System Architecture](./_git_readme/chart/system_architect.svg)

### Data Flow

1. **Player Authentication**
   - User connects Freighter or Dynamic wallet
   - Frontend verifies wallet signature
   - Player profile loaded from Redux state

2. **Match Initialization**
   - Player selects character, weapons, map, and game mode
   - Frontend calls Soroban contract to stake XLM
   - Smart contract locks funds and creates match record
   - Matchmaking pairs players with similar stakes

3. **Gameplay Loop**
   - React Three Fiber renders 3D environment
   - Cannon-es physics engine handles collisions and movement
   - Player inputs processed in real-time
   - All actions (shots, kills, movements) logged to local state
   - Huddle01 enables voice communication

4. **Match Settlement**
   - Frontend sends match results to Soroban contract
   - Contract verifies winner based on kill count
   - Automatic reward distribution (winner receives staked XLM minus platform fee)
   - Match data (all movements, actions) stored on-chain

5. **AI Analysis**
   - On-chain gameplay data fetched by Sofia backend
   - LangChain processes and analyzes player patterns
   - Groq Llama generates personalized coaching insights
   - Frontend displays Sofia's recommendations to player

### Smart Contract Architecture
```rust
// Simplified Soroban Contract Structure

pub struct MatchData {
    match_id: BytesN<32>,
    player_a: Address,
    player_b: Address,
    stake_amount: i128,
    winner: Option<Address>,
    timestamp: u64,
}

pub fn create_match(env: Env, player_a: Address, player_b: Address, stake: i128)
pub fn declare_winner(env: Env, match_id: BytesN<32>, winner: Address)
pub fn distribute_rewards(env: Env, match_id: BytesN<32>)
pub fn store_gameplay_data(env: Env, match_id: BytesN<32>, data: Bytes)
```

---

## 📸 Screenshots

### 🎮 Menus & Matchmaking
![Lobby](./_git_readme/lobby.png)
*Professional gaming lobby with character showcase*

![Host Lobby](./_git_readme/host_lobby.png)
*Matchmaking and lobby hosting interface*

![Loading Screen](./_git_readme/loadingscreen.png.png)
*High-fidelity loading screen and game entry*

![Character Store](./_git_readme/store.png)
*Detailed character marketplace with XLM integration*

### ⚔️ Gameplay & Combat
![Gameplay 1](./_git_readme/game_play.png)
*Intense third-person tactical combat*

![Gameplay 2](./_git_readme/game_play_1.png)
*Dynamic weapon mechanics and visual effects*

![Gameplay 3](./_git_readme/game_play_2.png)
*Immersive environment and map exploration*

![Gameplay 4](./_git_readme/game_play_3.png)
*Fast-paced shooter action in competitive arenas*

![Custom Timer](./_git_readme/custom_tmer.png)
*In-game UI featuring tactical match timers*

### ⛓️ Blockchain & UI/UX
![Entry Fee](./_git_readme/entry_fee.png)
*Seamless Soroban-powered match staking interface*

![Swap Interface](./_git_readme/swap.png)
*Integrated token swap for instant fund access*

![Exit Notification](./_git_readme/exit_notification.png)
*Polished match exit and result notifications*

### 🤖 Sofia AI Coaching
![Sofia AI Analysis](./_git_readme/sofia_ai.png)
*In-depth post-match analysis by Sofia AI agent*

---

## 🔗 Deployed Link

**Live Application:** [https://stellar-strike.vercel.app](https://stellar-strike.vercel.app)

**Testnet Explorer:** [https://stellar.expert/explorer/testnet/contract/CDQWERTYUIOP...](https://stellar.expert/explorer/testnet)

> ⚠️ Currently deployed on Stellar Testnet. Use testnet XLM from the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) for testing.

---

## 🎥 Demo Video

**Watch the gameplay and features demo:** [Hack the Vibe Demo (Google Drive)](https://drive.google.com/file/d/1jwEk34O4_JMSyUpcVa9rTsZX3FFshSg4/view?usp=sharing)

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **3D Graphics:** Three.js, React Three Fiber (R3F), Drei
- **Physics:** Cannon-es
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS, Framer Motion
- **Wallet Integration:** Stellar SDK, Freighter Wallet API, Dynamic

### Backend (AI Agent)
- **Runtime:** Python 3.11
- **Framework:** Flask
- **AI/ML:** LangChain, ChatGroq (Llama models)
- **Data Processing:** NumPy, Pandas

### Blockchain
- **Network:** Stellar (Soroban)
- **Smart Contracts:** Rust (Soroban SDK)
- **RPC:** Soroban RPC

### Communication
- **Voice Chat:** Huddle01 WebRTC

### DevOps
- **Hosting:** Vercel (Frontend), Railway (AI Backend)
- **Version Control:** Git, GitHub
- **CI/CD:** GitHub Actions

---

## 🚀 Installation & Setup

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
python >= 3.11
rust >= 1.70.0
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Stellar RPC endpoint and contract address

# Run development server
npm run dev

# Build for production
npm run build
```

### AI Backend Setup
```bash
cd agentic_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Groq API key

# Run Flask server
python app.py
```

### Smart Contract Deployment
```bash
cd stellar-contract

# Install Soroban CLI
cargo install --locked soroban-cli

# Build contract
soroban contract build

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_strike.wasm \
  --source YOUR_SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

---

## 🌟 Future Scope & Ecosystem Growth

### Phase 1: Enhanced Gaming Features (Q2 2025)
- **Tournament System:** Bracket-style competitions with larger prize pools
- **Team Modes:** 3v3 and 5v5 squad-based gameplay
- **Ranked Matchmaking:** ELO-based competitive ranking system
- **Seasonal Passes:** Time-limited challenges with exclusive rewards
- **Replay System:** Download and share match recordings

### Phase 2: Real-World Asset (RWA) Tokenization (Q3 2025)

#### In-Game Asset Tokenization
**Problem:** Players invest time and skill developing valuable in-game assets (rare characters, legendary weapons, exclusive maps) but have no true ownership or ability to monetize them outside the game's walled garden.

**Solution:** Tokenize premium in-game assets as Stellar-based NFTs (using Soroban contracts), enabling:
- **Player-Owned Economies:** Characters, weapons, and maps become tradeable digital assets
- **Secondary Marketplaces:** Players can buy/sell assets peer-to-peer with XLM or USDC
- **Cross-Game Interoperability:** Partner with other Stellar games to enable asset portability
- **Fractional Ownership:** High-value tournament skins can be fractionalized, allowing communities to co-own rare items

---

## 🤝 Contributing

We welcome contributions from the Stellar community! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website:** [hack-the-vibe.vercel.app](https://hack-the-vibe.vercel.app)
- **Twitter:** [@HackTheVibe](https://twitter.com/HackTheVibe)

---

## 🙏 Acknowledgments

Built with ❤️ for the Stellar ecosystem

- Stellar Development Foundation for Soroban tools and documentation
- The Three.js and React Three Fiber communities
- LangChain and Groq teams for AI infrastructure
- All our playtesters and early supporters

---

**Hack the Vibe** - *Where Skill Meets Blockchain*

*Stake. Play. Dominate.*
