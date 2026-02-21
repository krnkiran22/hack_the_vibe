import React, { useEffect, useState, useMemo } from "react";
import "../styles/result.css";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { processGameEnd, collectWinnerRewards } from "../services/gameStaking";
import { useWalletStore } from "../store/walletStore";

const Result = () => {
  const navigate = useNavigate();
  const playerValue = useSelector((state) => state.authslice.playerdata);
  const { address } = useWalletStore();
  const [claimable, setClaimable] = useState(false);
  const [tokensAwarded, setTokensAwarded] = useState(0);
  const [prizeAmount, setPrizeAmount] = useState(0);
  const [winnerProcessed, setWinnerProcessed] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [gameId, setGameId] = useState(null);

  // Process team data using useMemo for performance
  const team = useMemo(() => {
    if (!playerValue || !Array.isArray(playerValue)) return [];

    return [...playerValue]
      .map((value, index) => ({
        id: value.id || index,
        name: value.state?.profile?.name || "Unknown Soldier",
        img: value.state?.profile?.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback",
        kills: value.state?.kills || 0,
        deaths: value.state?.deaths || 0,
        wallet: value.state?.profile?.wallet || "No Wallet",
        color: value.state?.profile?.color || "#9fc610"
      }))
      .sort((a, b) => b.kills - a.kills)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [playerValue]);

  const mvp = team[0] || null;

  useEffect(() => {
    if (team.length > 0 && !winnerProcessed) {
      // Award tokens based on performance
      const totalKills = team.reduce((sum, p) => sum + p.kills, 0);
      if (totalKills > 0) {
        setTokensAwarded(totalKills * 5);
        setClaimable(true);
      }

      // Process game end and send winner to contract
      const winner = team[0]; // MVP is the winner
      if (winner && team.length >= 2) {
        const player1 = team[0];
        const player2 = team[1];

        // Get game session
        const gameSession = localStorage.getItem('currentGameSession');
        const currentGameId = gameSession ? JSON.parse(gameSession).gameId : Date.now();
        setGameId(currentGameId);

        // Check if current user is the winner
        const userWallet = address?.toLowerCase();
        const winnerWallet = player1.wallet?.toLowerCase();
        const isCurrentUserWinner = userWallet && winnerWallet &&
          (userWallet === winnerWallet || userWallet.includes(winnerWallet) || winnerWallet.includes(userWallet));

        setIsWinner(isCurrentUserWinner);

        // Send winner wallet to contract
        processGameEnd(
          currentGameId,
          player1.wallet || address || 'unknown',
          player1.kills,
          player2.wallet || 'unknown',
          player2.kills
        ).then(result => {
          if (result.success && result.winner !== 'tie') {
            const prize = parseFloat(result.reward || '3.6'); // 2 players * 2 XLM * 0.9
            setPrizeAmount(prize);
            if (isCurrentUserWinner) {
              toast.success(`🏆 You Won! Prize: ${prize.toFixed(2)} XLM ready to collect!`);
            } else {
              toast.info(`Game ended. Winner: ${winner.name}`);
            }
          }
        }).catch(err => {
          console.error('Failed to process game end:', err);
        });

        setWinnerProcessed(true);
      }

      // Play victory confetti only for winner
      if (isWinner) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);

        return () => clearInterval(interval);
      }
    }
  }, [team, winnerProcessed, address, isWinner]);

  const handleCollectRewards = async () => {
    if (!gameId) {
      toast.error('Game ID not found');
      return;
    }

    setIsCollecting(true);
    try {
      const result = await collectWinnerRewards(gameId);
      if (result.success) {
        toast.success(`🎉 Collected ${result.amount} XLM!`);
        setTimeout(() => {
          navigate("/lobby");
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to collect rewards:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  const handleClaim = async () => {
    // Here you would typically trigger an on-chain transaction
    setClaimable(false);
    navigate("/lobby");
  };

  return (
    <div className="result-screen">
      <div className="result-header">
        <h1>Mission Accomplished</h1>
        <p style={{ color: "var(--text-muted)", letterSpacing: "2px" }}>FINAL STANDINGS</p>
      </div>

      {mvp && (
        <section className="mvp-section">
          <div className="mvp-card">
            <div className="mvp-avatar-wrapper">
              <span className="mvp-crown">👑</span>
              <img src={mvp.img} alt={mvp.name} className="mvp-avatar" />
            </div>
            <div className="mvp-info">
              <h2>Most Valuable Player</h2>
              <p className="mvp-name">{mvp.name}</p>
              {prizeAmount > 0 && (
                <div className="prize-banner" style={{
                  background: isWinner
                    ? 'linear-gradient(135deg, #a3ff12 0%, #7bc900 100%)'
                    : 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  margin: '16px 0',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  textAlign: 'center',
                  boxShadow: isWinner
                    ? '0 4px 20px rgba(163, 255, 18, 0.5)'
                    : '0 4px 20px rgba(255, 68, 68, 0.5)',
                  border: isWinner ? '2px solid #a3ff12' : '2px solid #ff4444'
                }}>
                  {isWinner ? '🏆 YOU WON!' : '💔 YOU LOST'} {prizeAmount.toFixed(2)} XLM
                </div>
              )}
              <div className="mvp-stats">
                <div className="stat-item">
                  <span className="stat-value">{mvp.kills}</span>
                  <span className="stat-label">Total Kills</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{mvp.deaths}</span>
                  <span className="stat-label">Deaths</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{(mvp.kills / (mvp.deaths || 1)).toFixed(2)}</span>
                  <span className="stat-label">K/D Ratio</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="leaderboard-container">
        {team.map((player) => (
          <div key={player.id} className={`player-row rank-${player.rank}`}>
            <div className="rank-badge">
              {player.rank === 1 ? "1st" : player.rank === 2 ? "2nd" : player.rank === 3 ? "3rd" : player.rank}
            </div>
            <div className="player-identity">
              <img src={player.img} alt={player.name} className="player-avatar-mini" />
              <span className="player-name-mini">{player.name}</span>
            </div>
            <div className="stat-group">
              <span className="stat-label">Kills</span>
              <div className="kd-val kills">{player.kills}</div>
            </div>
            <div className="stat-group">
              <span className="stat-label">Deaths</span>
              <div className="kd-val deaths">{player.deaths}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="action-bar">
        {isWinner ? (
          <>
            <button
              onClick={handleCollectRewards}
              className="btn-premium btn-claim"
              disabled={isCollecting}
              style={{
                background: 'linear-gradient(135deg, #a3ff12 0%, #7bc900 100%)',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '18px',
                padding: '16px 32px',
                border: '2px solid #a3ff12',
                boxShadow: '0 4px 20px rgba(163, 255, 18, 0.4)',
                cursor: isCollecting ? 'not-allowed' : 'pointer',
                opacity: isCollecting ? 0.6 : 1
              }}
            >
              {isCollecting ? (
                <>
                  <span className="spinner" style={{ marginRight: '8px' }}>⏳</span>
                  Collecting...
                </>
              ) : (
                <>
                  🎁 Collect {prizeAmount.toFixed(2)} XLM Rewards
                </>
              )}
            </button>
            {claimable && (
              <button onClick={handleClaim} className="btn-premium btn-lobby" style={{ marginLeft: '12px' }}>
                Claim {tokensAwarded} RO$ Tokens
              </button>
            )}
          </>
        ) : (
          <Link
            to="/lobby"
            className="btn-premium btn-lobby"
            style={{
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '18px',
              padding: '16px 32px',
              border: '2px solid #ff4444',
              boxShadow: '0 4px 20px rgba(255, 68, 68, 0.4)',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            🏠 Return Home
          </Link>
        )}
      </div>
    </div>
  );
};

export default Result;
