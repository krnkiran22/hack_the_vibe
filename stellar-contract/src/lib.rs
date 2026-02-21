#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Vec, token
};

#[contracttype]
pub enum DataKey {
    Admin,
    StakeAmount,
    PlayerStakes(Address),
    GameMatches(u64), // game_id -> GameMatch
    MatchCounter,
}

#[contracttype]
#[derive(Clone)]
pub struct GameMatch {
    pub game_id: u64,
    pub players: Vec<Address>,
    pub stake_per_player: i128,
    pub total_pool: i128,
    pub winner: Option<Address>,
    pub ipfs_hash: Option<String>,
    pub is_active: bool,
}

#[contract]
pub struct GameStakingContract;

#[contractimpl]
impl GameStakingContract {
    
    /// Initialize the contract with admin and stake amount
    pub fn initialize(env: Env, admin: Address, stake_amount: i128) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::StakeAmount, &stake_amount);
        env.storage().instance().set(&DataKey::MatchCounter, &0u64);
    }
    
    /// Players stake to enter the game
    pub fn stake_to_play(
        env: Env,
        player: Address,
        token_address: Address,
        game_id: u64,
    ) {
        player.require_auth();
        
        // Get required stake amount
        let stake_amount: i128 = env.storage().instance().get(&DataKey::StakeAmount).unwrap();
        
        // Check if player already staked for this game
        let player_key = DataKey::PlayerStakes(player.clone());
        if env.storage().instance().has(&player_key) {
            let staked_game_id: u64 = env.storage().instance().get(&player_key).unwrap();
            if staked_game_id == game_id {
                panic!("Player already staked for this game");
            }
        }
        
        // Transfer tokens from player to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &player,
            &env.current_contract_address(),
            &stake_amount,
        );
        
        // Record player stake
        env.storage().instance().set(&player_key, &game_id);
        
        // Update or create game match
        let match_key = DataKey::GameMatches(game_id);
        let mut game_match: GameMatch = env.storage().instance()
            .get(&match_key)
            .unwrap_or(GameMatch {
                game_id,
                players: Vec::new(&env),
                stake_per_player: stake_amount,
                total_pool: 0,
                winner: None,
                ipfs_hash: None,
                is_active: true,
            });
        
        game_match.players.push_back(player.clone());
        game_match.total_pool += stake_amount;
        
        env.storage().instance().set(&match_key, &game_match);
    }
    
    /// Distribute rewards to winner and store IPFS hash
    pub fn declare_winner(
        env: Env,
        admin: Address,
        game_id: u64,
        winner: Address,
        ipfs_hash: String,
        token_address: Address,
    ) {
        admin.require_auth();
        
        // Verify admin
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        // Get game match
        let match_key = DataKey::GameMatches(game_id);
        let mut game_match: GameMatch = env.storage().instance()
            .get(&match_key)
            .unwrap_or_else(|| panic!("Game not found"));
        
        if !game_match.is_active {
            panic!("Game already finished");
        }
        
        // Verify winner is a player in this game
        let mut winner_found = false;
        for player in game_match.players.iter() {
            if player == winner {
                winner_found = true;
                break;
            }
        }
        if !winner_found {
            panic!("Winner not in player list");
        }
        
        // Calculate platform fee (5%)
        let platform_fee = game_match.total_pool * 5 / 100;
        let winner_amount = game_match.total_pool - platform_fee;
        
        // Transfer winnings to winner
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &winner,
            &winner_amount,
        );
        
        // Transfer platform fee to admin
        token_client.transfer(
            &env.current_contract_address(),
            &admin,
            &platform_fee,
        );
        
        // Update game match with winner and IPFS hash
        game_match.winner = Some(winner.clone());
        game_match.ipfs_hash = Some(ipfs_hash);
        game_match.is_active = false;
        
        env.storage().instance().set(&match_key, &game_match);
        
        // Clear player stakes
        for player in game_match.players.iter() {
            env.storage().instance().remove(&DataKey::PlayerStakes(player));
        }
    }
    
    /// Get game match details
    pub fn get_game_match(env: Env, game_id: u64) -> GameMatch {
        let match_key = DataKey::GameMatches(game_id);
        env.storage().instance()
            .get(&match_key)
            .unwrap_or_else(|| panic!("Game not found"))
    }
    
    /// Check if player has staked
    pub fn has_staked(env: Env, player: Address) -> bool {
        env.storage().instance().has(&DataKey::PlayerStakes(player))
    }
    
    /// Get player's staked game ID
    pub fn get_player_game(env: Env, player: Address) -> Option<u64> {
        env.storage().instance().get(&DataKey::PlayerStakes(player))
    }
    
    /// Get required stake amount
    pub fn get_stake_amount(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::StakeAmount).unwrap()
    }
    
    /// Update stake amount (admin only)
    pub fn update_stake_amount(env: Env, admin: Address, new_amount: i128) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Unauthorized");
        }
        
        env.storage().instance().set(&DataKey::StakeAmount, &new_amount);
    }
    
    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

mod test;
