import { Environment } from "@react-three/drei";
import {
  Joystick,
  insertCoin,
  isHost,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
  useIsHost,
  setState,
  getState,
} from "playroomkit";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Bullet } from "./Bullet";
import { BulletHit } from "./BulletHit";
import { CharacterController } from "./CharacterController";
import { TCPCharacterController } from "./TCPCharacterController";
import { Map } from "./Map";
import { SkyBox } from "./SkyBox";
// import { stakeForGame, canPlayerStake } from "../services/gameStaking";

export const Experience = ({ downgradedPerformance = false }) => {
  const [players, setPlayers] = useState([]);
  const [mode, setMode] = useState("Normal"); // State for mode
  const [characterPosition, setCharacterPosition] = useState(null); // State for character position
  const lastPositionRef = useRef(null); // Store the last known position
  const time = useSelector((state) => state.authslice.selectedTime);
  const showMobileControls = useSelector((state) => state.authslice.showMobileControls);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const [gameStarted, setGameStarted] = useMultiplayerState("gameStarted", false);
  const [timer, setTimer] = useMultiplayerState("timer");

  const start = async () => {
    // Start the game
    await insertCoin();

    const host = isHost();
    const currentGameId = Date.now(); // Generate game ID

    if (host) {
      console.log("Host detected - setting up game");

      // Host has already staked in StakeModal before coming here
      const gameSession = localStorage.getItem('currentGameSession');
      if (gameSession) {
        const session = JSON.parse(gameSession);
        console.log('✅ Host stake verified:', session);
      }

      setState("gameStarted", true, true);
      setState("gameId", currentGameId, true);

      // AUTHORITATIVE: Only set initial timer if it hasn't been set by host yet
      if (getState("timer") === undefined) {
        setState("timer", time || 60, true);
      }
    } else {
      console.log("Joined as client - No staking required for testing");
    }

    // Create a joystick controller for each joining player
    onPlayerJoin((state) => {
      // Show joystick if mobile OR if desktop mobile option is enabled
      const shouldShowJoystick = isMobile || showMobileControls;

      let joystick = null;
      if (shouldShowJoystick) {
        joystick = new Joystick(state, {
          type: "angular",
          buttons: [
            { id: "fire", label: "Fire" },
            { id: "jump", label: "Jump" },
            { id: "switch", label: "Switch" },
          ],
        });
      }
      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);
      state.setState("killStreak", 0);

      // Initialize player profile from local storage for the local player
      if (state.id === myPlayer()?.id) {
        const storedEquipped = localStorage.getItem("stark_equipped");
        const walletState = localStorage.getItem("wallet-store");
        let username = "Unknown Soldier";

        // Get username from wallet store
        if (walletState) {
          try {
            const parsedState = JSON.parse(walletState);
            username = parsedState?.state?.username || "Unknown Soldier";
          } catch (e) {
            console.error("Failed to parse wallet state:", e);
          }
        }

        if (storedEquipped) {
          const gear = JSON.parse(storedEquipped);
          state.setState("profile", {
            name: username,
            char: gear.CHARACTERS,
            weapon: gear.WEAPONS
          });
        } else {
          state.setState("profile", {
            name: username,
            char: "SHADOW ELITE",
            weapon: "AK"
          });
        }
      }

      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });
  };

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    // Add keydown event listener for "m" key
    const handleKeyDown = (event) => {
      if (event.key === "m") {
        // Capture the current player's position before mode change
        players.forEach(({ state }) => {
          if (state.id === myPlayer()?.id) {
            const position = state.getState("pos");
            if (position) {
              lastPositionRef.current = position; // Store the current position before switching modes
            }
          }
        });

        // Toggle between "TCP" and "Normal" modes
        setMode((prevMode) => (prevMode === "Normal" ? "TCP" : "Normal"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener when component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [players]);

  // Shared Bullet State removed in favor of per-player state
  // const [networkBullets, setNetworkBullets] = useMultiplayerState("bullets", []);
  const [networkHits, setNetworkHits] = useMultiplayerState("hits", []);

  const amIHost = useIsHost();

  useEffect(() => {
    if (amIHost && gameStarted) {
      console.log("AUTHORITATIVE TIMER STARTING. Initial state:", getState("timer"));
      const interval = setInterval(() => {
        const current = getState("timer") ?? time ?? 60;
        if (current > 0) {
          const next = current - 1;
          setState("timer", next, true);
          // console.log("AUTHORITATIVE TICK:", next);
        } else {
          console.log("AUTHORITATIVE TIMER: 0 reached");
        }
      }, 1000);
      return () => {
        console.log("AUTHORITATIVE TIMER CLEANUP");
        clearInterval(interval);
      };
    }
  }, [amIHost, gameStarted, time]);

  // Host: Per-Player Bullet Cleanup (Every 1s, remove bullets > 5s old)
  useEffect(() => {
    if (amIHost) {
      const cleanupInterval = setInterval(() => {
        const now = Date.now();
        players.forEach(p => {
          const currentBullets = p.state.getState("bullets") || [];
          const activeBullets = currentBullets.filter(b => {
            const parts = b.id.split('-');
            const timestamp = parseInt(parts[1]);
            return (now - timestamp) < 60000;
          });
          if (activeBullets.length !== currentBullets.length) {
            p.state.setState("bullets", activeBullets);
          }
        });
      }, 1000);
      return () => clearInterval(cleanupInterval);
    }
  }, [amIHost, players]);

  const onFire = (bullet) => {
    // Find the player who fired and update their state
    const shooter = players.find(p => p.state.id === bullet.player);
    if (shooter) {
      const currentBullets = shooter.state.getState("bullets") || [];
      shooter.state.setState("bullets", [...currentBullets, bullet]);
    }
  };

  const onHit = (bulletId, position) => {
    // Find the bullet owner and remove it from their state
    const playerId = bulletId.split('-')[0];
    const shooter = players.find(p => p.state.id === playerId);

    if (shooter) {
      const currentBullets = shooter.state.getState("bullets") || [];
      const updatedBullets = currentBullets.filter(b => b.id !== bulletId);
      if (updatedBullets.length !== currentBullets.length) {
        shooter.state.setState("bullets", updatedBullets);
      }
    }
    setNetworkHits((prev) => [...(prev || []), { id: bulletId, position }]);
  };

  const onHitEnded = (hitId) => {
    setNetworkHits((prev) => (prev || []).filter((h) => h.id !== hitId));
  };

  const onKilled = (_victim, killer) => {
    const killerState = players.find((p) => p.state.id === killer)?.state;
    const victimState = players.find((p) => p.state.id === _victim)?.state;

    if (!killerState || !victimState) return;

    const currentKills = killerState.getState("kills") || 0;
    const currentStreak = killerState.getState("killStreak") || 0;
    killerState.setState("kills", currentKills + 1);
    killerState.setState("killStreak", currentStreak + 1);

    const currentDeaths = victimState.getState("deaths") || 0;
    victimState.setState("deaths", currentDeaths + 1);
    victimState.setState("killStreak", 0); // Reset victim streak

    // Broadcast Kill Feed
    const currentFeed = getState("killFeed") || [];
    const killerName = killerState.getState("profile")?.name || killerState.profile?.name || "Unknown Operator";
    const victimName = victimState.getState("profile")?.name || victimState.profile?.name || "Unknown Target";

    const newEvent = {
      killer: killerName,
      victim: victimName,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      time: Date.now()
    };
    // Keep last 5 events
    setState("killFeed", [...currentFeed, newEvent].slice(-5), true);
  };

  return (
    <>
      <Map />
      {players.map(({ state, joystick }) =>
        mode === "TCP" ? (
          <TCPCharacterController
            key={state.id}
            state={state}
            userPlayer={state.id === myPlayer()?.id}
            joystick={joystick}
            onKilled={onKilled}
            onFire={onFire}
            downgradedPerformance={downgradedPerformance}
            // Apply stored position when mode changes
            initialPosition={lastPositionRef.current || { x: 0, y: 0, z: 0 }} // Reuse the last position, or default to origin
          />
        ) : (
          <CharacterController
            key={state.id}
            state={state}
            userPlayer={state.id === myPlayer()?.id}
            joystick={joystick}
            onKilled={onKilled}
            onFire={onFire}
            downgradedPerformance={downgradedPerformance}
            // Apply stored position when mode changes
            initialPosition={lastPositionRef.current || { x: 0, y: 0, z: 0 }} // Reuse the last position, or default to origin
          />
        )
      )}
      {players.flatMap(p => p.state.getState("bullets") || []).map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onHit={(position) => onHit(bullet.id, position)}
        />
      ))}
      {networkHits?.map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
      <SkyBox />
      <Environment preset="sunset" />
    </>
  );
};
