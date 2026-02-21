#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, GameStakingContract);
    let client = GameStakingContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let stake_amount: i128 = 100_000_000; // 10 XLM
    
    client.initialize(&admin, &stake_amount);
    
    assert_eq!(client.get_stake_amount(), stake_amount);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, GameStakingContract);
    let client = GameStakingContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let stake_amount: i128 = 100_000_000;
    
    client.initialize(&admin, &stake_amount);
    client.initialize(&admin, &stake_amount); // Should panic
}

#[test]
fn test_stake_to_play() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, GameStakingContract);
    let client = GameStakingContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let token_address = Address::generate(&env);
    let stake_amount: i128 = 100_000_000;
    let game_id: u64 = 1;
    
    client.initialize(&admin, &stake_amount);
    
    // In real scenario, token transfer would happen
    // Here we're just testing the logic
    client.stake_to_play(&player, &token_address, &game_id);
    
    assert!(client.has_staked(&player));
}

#[test]
fn test_get_game_match() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, GameStakingContract);
    let client = GameStakingContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let token_address = Address::generate(&env);
    let stake_amount: i128 = 100_000_000;
    let game_id: u64 = 1;
    
    client.initialize(&admin, &stake_amount);
    
    client.stake_to_play(&player1, &token_address, &game_id);
    client.stake_to_play(&player2, &token_address, &game_id);
    
    let game_match = client.get_game_match(&game_id);
    
    assert_eq!(game_match.game_id, game_id);
    assert_eq!(game_match.players.len(), 2);
    assert_eq!(game_match.total_pool, stake_amount * 2);
    assert!(game_match.is_active);
}
