import React, { useState, useEffect, useRef, startTransition, Suspense } from "react";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setTimer, setMode, setSoundEnabled, setShowMobileControls } from "../../store/authslice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DotLoader } from "react-spinners";
import { GLTFLoader } from "three-stdlib";
import { CharacterSoldier } from "./CharacterSoldier";
import { useWalletStore } from "../store/walletStore";
import SwapInterface from "./SwapInterface";
import StakeModal from "./StakeModal";
import { LoadingScreen } from "./LoadingScreen";
import { UI as SofiaUI } from "./sofia/UI";
import { Experience as SofiaExperience } from "./sofia/Experience";
import { ChatProvider } from "./sofia/hooks/useChat";
import { motion, AnimatePresence } from "framer-motion";
import UsernamePrompt from "./UsernamePrompt";

const mapPaths = [
  "./bermuda.svg",
  "https://blogger.googleusercontent.com/img/a/AVvXsEiIDKYobYMAxdl5gAtBoE7B8P9G8iB0AYJUfiA0kR0NubthcLBo_LyYjsajGpA0jr6B1mCVB0lG5ZhMnhFYjNtbY5CiE6PJYmlXaAv5-TZ9GFJjnNZhLCulC76CPvjJfPmfIq3_5bvh0U7N7g784SznhnU5qS_uaRzeL2RsDlx39RboomQP1eg_MmahpNY",
  "/textures/anime_art_style_a_water_based_pokemon_like_environ.jpg",
  "/textures/anime_art_style_cactus_forest.jpg",
  "/textures/anime_art_style_lava_world.jpg",
  "https://blogger.googleusercontent.com/img/a/AVvXsEgHxU-HB-lQ9ifrEy-ymcHR6aeTkwzBaOsIQ6SXinjXyVVmqCbtY44ZraIGYM86B6DT7vk3jDrQSbdJn61D6jZB3HX3aRSc7EIYnSStvJmZefxCOpcKRZVFqha7jg0dd4i-0qZN-87FqviZbUY3oODu3bvJZK9ytVKnLRYcgFpo9hz4JzK25BmQS5c9TMI",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
];

const mapNames = [
  "bermuda",
  "pochinki",
  "knife fight map",
  "free arena",
  "city side map",
  "living room",
  "grave house map",
  "broken house map"
];

const mapModels = [
  "",
  "",
  "models/knife_fight_map.glb",
  "models/map.glb",
  "models/city_side_map.glb",
  "models/living_room.glb",
  "models/grave_house_map.glb",
  "models/broken_house_map.glb"
];

const itemsData = {
  CHARACTERS: [
    { name: "SHADOW ELITE", price: "FREE", color: "#000000", power: "STEALTH + 15%", desc: "The ultimate stealth operative, merging with shadows for lethal efficiency." },
    { name: "URBAN STRIKER", price: "FREE", color: "#3b82f6", power: "ACCURACY + 10%", desc: "City combat specialist with unmatched precision in close quarters." },
    { name: "JUNGLE GHOST", price: "FREE", color: "#166534", power: "STAMINA + 15%", desc: "Endurance expert trained in deep-forest survival operations." },
    { name: "ARCTIC WOLF", price: "FREE", color: "#f8fafc", power: "REGEN + 2%/sec", desc: "Tough survivor optimized for sub-zero medical recovery." },
    { name: "RECON ELITE", price: "50 XLM", color: "#4ade80", power: "SPEED + 10%", desc: "Highly agile scout specialized in rapid deployment." },
    { name: "DESERT FOX", price: "75 XLM", color: "#f59e0b", power: "DURABILITY + 15%", desc: "Heavy mercenary built to survive high-impact environments." },
    { name: "NEON REAPER", price: "120 XLM", color: "#a3ff12", power: "DAMAGE + 15%", desc: "Experimental cyber-soldier with ultra-lethal efficiency." },
    { name: "PLASMA VORTEX", price: "180 XLM", color: "#c026d3", power: "SHIELD + 20%", desc: "High-tech vanguard equipped with energy-deflection armor." },
  ],
  WEAPONS: [
    { name: "AK", price: "FREE", stats: { dmg: 40, rate: 80, range: 60 } },
    { name: "Sniper", price: "90 XLM", stats: { dmg: 95, rate: 10, range: 95 } },
    { name: "Sniper_2", price: "120 XLM", stats: { dmg: 98, rate: 15, range: 98 } },
    { name: "RocketLauncher", price: "150 XLM", stats: { dmg: 100, rate: 5, range: 50 } },
    { name: "GrenadeLauncher", price: "FREE", stats: { dmg: 90, rate: 15, range: 40 } },
    { name: "SMG", price: "FREE", stats: { dmg: 30, rate: 95, range: 40 } },
    { name: "Shotgun", price: "80 XLM", stats: { dmg: 85, rate: 20, range: 20 } },
    { name: "Pistol", price: "FREE", stats: { dmg: 25, rate: 60, range: 30 } },
    { name: "Revolver", price: "40 XLM", stats: { dmg: 50, rate: 30, range: 45 } },
    { name: "Revolver_Small", price: "FREE", stats: { dmg: 45, rate: 35, range: 40 } },
    { name: "ShortCannon", price: "110 XLM", stats: { dmg: 95, rate: 10, range: 35 } },
    { name: "Knife_1", price: "FREE", stats: { dmg: 35, rate: 85, range: 5 } },
    { name: "Knife_2", price: "25 XLM", stats: { dmg: 45, rate: 90, range: 5 } },
    { name: "Shovel", price: "FREE", stats: { dmg: 30, rate: 50, range: 10 } },
  ]
};

const Lobby = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playerinfo = useSelector((state) => state?.authslice?.playerdata);
  const [introFinished, setIntroFinished] = useState(false);
  const {
    address,
    isConnected,
    provider,
    connect,
    disconnect,
    fetchBalances,
    balances: walletBalances,
    username: storedUsername
  } = useWalletStore();
  const [loading, setLoading] = useState(true);
  const [mapIndex, setMapIndex] = useState(0);
  const [playerData, setPlayerData] = useState(playerinfo || null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeButton, setActiveButton] = useState(2); // Default to 5 mins
  const soundEnabled = useSelector((state) => state?.authslice?.soundEnabled ?? true);
  const showMobileControls = useSelector((state) => state?.authslice?.showMobileControls ?? false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [showChatUI, setShowChatUI] = useState(false);
  const [showSwapInterface, setShowSwapInterface] = useState(false);
  const [customTimeModal, setCustomTimeModal] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showStakeModal, setShowStakeModal] = useState(false);
  const videoRef = useRef(null);

  // Wallet connection handlers
  const handleConnectWallet = async () => {
    try {
      console.log('Attempting to connect wallet...');
      await connect('freighter');
      console.log('✅ Wallet connection successful');
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);

      // Don't show error if wallet actually connected
      if (isConnected) {
        console.log('Wallet is actually connected, ignoring error');
        return;
      }

      if (error.message.includes('not detected') || error.message.includes('not found')) {
        toast.error(
          <div>
            <strong>Freighter Wallet Not Found</strong><br />
            <small>1. Install Freighter from freighter.app<br />
              2. Refresh this page<br />
              3. Try connecting again</small>
          </div>,
          { autoClose: 8000 }
        );
      } else if (error.message.includes('rejected') || error.message.includes('declined')) {
        toast.error('Wallet connection was rejected');
      } else {
        toast.error(`Failed to connect wallet: ${error.message}`);
      }
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  const handleStartGame = () => {
    if (!isMapOwned(mapNames[mapIndex])) {
      return; // Don't allow if map not owned
    }
    setShowStakeModal(true);
  };

  const handleStakeSuccess = (gameId) => {
    console.log('Stake successful, navigating to game with ID:', gameId);
    setShowStakeModal(false);
    // Small delay to ensure modal closes
    setTimeout(() => {
      navigate('/game');
    }, 100);
  };

  // Effect to fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address, fetchBalances]);

  // Effect to prompt for username when wallet connects without username
  useEffect(() => {
    if (isConnected && address && !storedUsername) {
      console.log('📝 No username found, prompting user...');
      setShowUsernamePrompt(true);
    }
  }, [isConnected, address, storedUsername]);

  // Equipped State for Character & Weapon
  const [equippedGear, setEquippedGear] = useState({
    CHARACTERS: "SHADOW ELITE",
    WEAPONS: "AK"
  });

  // Auto-play audio handling for browser policies
  useEffect(() => {
    const handleInteraction = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Audio play blocked", e));
        videoRef.current.muted = false;
      }
      window.removeEventListener('click', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [soundEnabled]); // Re-run if soundEnabled changes

  const [ownedItems, setOwnedItems] = useState([]);

  // Load initial map selection and equipped gear from localStorage
  useEffect(() => {
    const storedMap = localStorage.getItem("selectedMap");
    if (storedMap) {
      const index = mapNames.indexOf(storedMap);
      if (index !== -1) {
        setMapIndex(index);
      }
    }

    const storedEquipped = localStorage.getItem("stark_equipped");
    if (storedEquipped) {
      setEquippedGear(JSON.parse(storedEquipped));
    }

    const storedOwned = localStorage.getItem("stark_owned_items");
    if (storedOwned) {
      setOwnedItems(JSON.parse(storedOwned));
    }

    // Auto-select 5 mins (300s) if no time is stored
    const storedTime = localStorage.getItem("selectedTime");
    if (!storedTime) {
      if (dispatch) dispatch(setTimer(300));
      localStorage.setItem("selectedTime", "300");
      setActiveButton(2);
    } else {
      const timeVal = parseInt(storedTime);
      const standardTimes = [60, 300, 600];
      const standardIdx = standardTimes.indexOf(timeVal);
      if (standardIdx !== -1) {
        setActiveButton(standardIdx + 1);
      } else {
        setActiveButton(4); // CUSTOM
        setCustomMinutes((timeVal / 60).toString());
      }
    }
  }, []);

  // Helper to get character color from name
  const getCharacterColor = (name) => {
    const char = itemsData.CHARACTERS.find(c => c.name === name);
    return char ? char.color : "#4ade80";
  };

  const isMapOwned = (name) => {
    // First 4 maps are always free
    const freeMaps = ["bermuda", "pochinki", "knife fight map", "free arena"];
    if (freeMaps.includes(name)) return true;
    return ownedItems.includes(name);
  };

  const leftClick = () => {
    const update = () => {
      setMapIndex((prevIndex) => {
        const newIndex = prevIndex === 0 ? mapPaths.length - 1 : prevIndex - 1;
        localStorage.setItem("selectedMap", mapNames[newIndex]);
        return newIndex;
      });
    };
    if (React.startTransition) React.startTransition(update);
    else update();
  };

  const rightClick = () => {
    const update = () => {
      setMapIndex((prevIndex) => {
        const newIndex = prevIndex === mapPaths.length - 1 ? 0 : prevIndex + 1;
        localStorage.setItem("selectedMap", mapNames[newIndex]);
        return newIndex;
      });
    };
    if (React.startTransition) React.startTransition(update);
    else update();
  };

  const setGameTime = (time, buttonId) => {
    if (buttonId === 4) {
      setCustomTimeModal(true);
      return;
    }
    const update = () => {
      dispatch(setTimer(time));
      setActiveButton(buttonId);
      localStorage.setItem("selectedTime", time);
    };
    if (React.startTransition) React.startTransition(update);
    else update();
  };

  const handleCustomTimeSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (isNaN(mins) || mins <= 0) {
      toast.error("INVALID TEMPORAL CLEARANCE // ENTER POSITIVE MINUTES");
      return;
    }
    const secs = mins * 60;
    const update = () => {
      dispatch(setTimer(secs));
      setActiveButton(4);
      localStorage.setItem("selectedTime", secs.toString());
      setCustomTimeModal(false);
      toast.success(`TEMPORAL WINDOW SET: ${mins} MINUTES`);
    };
    if (React.startTransition) React.startTransition(update);
    else update();
  };

  const activeMode = useSelector((state) => state?.authslice?.selectedMode);
  const [gameMode, setGameMode] = useState(activeMode || "Free Style");
  const modes = ["Free Style", "Knife Fight", "TPP"];

  const handleModeChange = (mode) => {
    const update = () => {
      setGameMode(mode);
      dispatch(setMode(mode));
    };
    if (React.startTransition) React.startTransition(update);
    else update();
  };

  return (
    <>
      {!introFinished && <LoadingScreen onFinished={() => setIntroFinished(true)} />}
      <div className={`h-screen w-screen relative overflow-hidden font-sans select-none transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
        {/* Dynamic Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          playsInline
          muted={!soundEnabled}
          className="absolute inset-0 w-full h-full object-cover"
          src="/I_need_looping_202602072235_b73bi.mp4"
        ></video>

        {/* Overlays */}
        <div className="cyber-overlay"></div>



        {/* Background: Character Stage (Full Height) */}
        <div className="absolute inset-0 z-[5]">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-[50vw] h-full cursor-grab active:cursor-grabbing">
              <Canvas camera={{ fov: 40, position: [0, 0, 5] }} shadows gl={{ antialias: true }}>
                <ambientLight intensity={0.8} />
                <spotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={3} castShadow />
                <Suspense fallback={null}>
                  <CharacterSoldier
                    animation="Idle"
                    color={getCharacterColor(equippedGear.CHARACTERS)}
                    weapon={equippedGear.WEAPONS}
                    position={[-0.1, -1, 0]}
                    scale={0.85}
                  />
                  <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 2.2}
                    maxPolarAngle={Math.PI / 2.2}
                    makeDefault
                  />
                </Suspense>
              </Canvas>

              {/* Character Nameplate */}
              <div className="absolute bottom-[5%] left-[48%] -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div className="flex items-center space-x-3 mb-1">
                  <div className="h-0.5 w-10 bg-gradient-to-r from-transparent to-lime"></div>
                  <span className="text-[10px] text-lime font-black tracking-[0.5em] uppercase">Tactical Unit</span>
                  <div className="h-0.5 w-10 bg-gradient-to-l from-transparent to-lime"></div>
                </div>
                <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  {equippedGear.CHARACTERS}
                </h2>
                <div className="mt-4 px-6 py-1 border border-white/20 bg-black/60 backdrop-blur-xl skew-x-[-12deg] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] text-white/80 font-black tracking-widest uppercase italic block skew-x-[12deg]">
                    Status: Ready for Deployment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 flex flex-col pointer-events-none overflow-hidden">
          {/* Header: Identity & Economy */}
          <div className="flex justify-between items-start w-full px-12 py-8">
            <div className="homeprofilebg flex items-center p-1 pr-8 space-x-6 pointer-events-auto">
              <div className="relative group">
                <img
                  src="/profile.png"
                  className="h-20 w-20 profile-avatar object-cover group-hover:scale-110 transition-all duration-500 rounded-none border border-lime/20"
                  alt="Profile Avatar"
                  onError={(e) => {
                    e.target.src = "https://blogger.googleusercontent.com/img/a/AVvXsEilxD0f-Y5qYnr3AA8xT_tvMlR7ru7Yl1zxozlEzg-C5oJqOStwAR8OxsgItoWC112TQTgCt4_xylJDmr4v_Z_A3MDUy22L6CAI_Cvw_FnicYCcoXScnCt41T-xiWNZ8JQJyfbXNdygsgY9TxXvH-Yqdg0vqpeMrakh78RxXj5BAT4XwW1a3KsQVhexzog";
                  }}
                />
                <div className="absolute -bottom-2 -right-4 rank-badge">LV 01</div>
              </div>

              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                  {storedUsername || playerData?.name || "STELLAR_OPERATIVE"}
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="w-40 h-1 bg-white/10 relative">
                    <div className="absolute inset-0 bg-lime shadow-[0_0_10px_#A3FF12] w-2/5"></div>
                  </div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">XP 1240/5000</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-6 pointer-events-auto">
              <div className="currency-display flex items-center space-x-4">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Gold Stock</div>
                <p className="font-black text-[#FFD27F] text-xl tabular-nums">1,240</p>
              </div>
              <div className="currency-display flex items-center space-x-4 border-r-lime">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-tighter">Stellar Credits</div>
                <p className="font-black text-cyan text-xl tabular-nums">
                  {isConnected && walletBalances.length > 0
                    ? (() => {
                      const xlmBalance = walletBalances.find(b => b.asset_code === 'XLM');
                      return xlmBalance ? parseFloat(xlmBalance.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 7
                      }) : '0.00';
                    })()
                    : '0.00'
                  }
                </p>
              </div>
              {/* Settings Terminal Access */}
              <button
                onClick={() => setSettingsModal(true)}
                className="relative p-3 bg-black/40 hover:bg-lime/20 border border-white/10 hover:border-lime/50 transition-all group pointer-events-auto overflow-hidden"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 80% 100%, 0 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-lime/0 to-lime/5 group-hover:to-lime/10 transition-all"></div>
                <svg
                  className="w-5 h-5 text-white/60 group-hover:text-lime transition-all duration-500 group-hover:rotate-90 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="absolute -left-full group-hover:left-full bottom-0 w-full h-[1px] bg-lime transition-all duration-700 opacity-50"></div>
              </button>

              {/* Wallet Connection Button */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="walletinfo-display flex flex-col items-end">
                    <div className="text-[8px] font-black text-lime uppercase tracking-tighter">
                      {storedUsername || 'Stellar Wallet Connected'}
                    </div>
                    <div className="font-mono text-white text-[11px] font-bold">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                    </div>
                    {walletBalances.length > 0 && (() => {
                      const xlmBalance = walletBalances.find(b => b.asset_code === 'XLM');
                      return xlmBalance ? (
                        <div className="text-[8px] text-lime/70 font-mono">
                          {parseFloat(xlmBalance.balance).toFixed(2)} XLM
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={handleDisconnectWallet}
                    className="relative px-3 py-3 bg-lime/20 hover:bg-red-500/20 border border-lime/50 hover:border-red-500/50 transition-all group pointer-events-auto overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 80% 100%, 0 100%)' }}
                    title="Disconnect Wallet"
                  >
                    <div className="flex items-center space-x-1">
                      <svg className="h-4 w-4 text-lime group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-[8px] font-black text-lime group-hover:text-red-400 uppercase tracking-widest">Disconnect</span>
                    </div>
                    <div className="absolute -left-full group-hover:left-full bottom-0 w-full h-[1px] bg-red-400 transition-all duration-700 opacity-50"></div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="relative px-4 py-3 bg-black/40 hover:bg-lime/20 border border-white/10 hover:border-lime/50 transition-all group pointer-events-auto overflow-hidden"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 80% 100%, 0 100%)' }}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-white group-hover:text-lime transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-black text-white/80 group-hover:text-lime uppercase tracking-widest">Connect Wallet</span>
                  </div>
                  <div className="absolute -left-full group-hover:left-full bottom-0 w-full h-[1px] bg-lime transition-all duration-700 opacity-50"></div>
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow flex justify-between items-center px-12 pb-12">
            {/* Left Panel: Tactical Suite */}
            <div className="homebox flex flex-col space-y-6 w-80 relative pointer-events-auto">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="h-4 w-1 bg-lime shadow-[0_0_10px_#A3FF12]"></div>
                  <div className="text-[10px] text-white/50 font-black tracking-[0.5em] uppercase">Tactical Suite</div>
                </div>

                {[
                  { name: "BATTLE PASS", id: "01", sub: "ELITE PROGRESSION" },
                  { name: "SWAP TO XLM", id: "02", sub: "STELLAR EXCHANGE", action: "swap" },
                  { name: "NEON ROYALE", id: "03", sub: "EVENT REWARDS" },
                  { name: "ARMORY", id: "04", sub: "WEAPON SYSTEMS" }
                ].map((item, i) => (
                  item.action === "swap" ? (
                    <button
                      key={item.name}
                      onClick={() => isConnected ? setShowSwapInterface(true) : handleConnectWallet()}
                      className="menu-tab block group relative w-full text-left"
                    >
                      <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex flex-col">
                          <div className="text-[10px] text-lime/40 font-black tracking-[0.3em] mb-1 group-hover:text-lime transition-colors">
                            PROTOCOL {item.id} {!isConnected && <span className="text-orange-400 animate-pulse">[WALLET REQUIRED]</span>}
                          </div>
                          <div className="text-white font-black text-2xl tracking-[0.15em] transition-all duration-300 group-hover:translate-x-2">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-white/20 font-bold tracking-widest mt-1 group-hover:text-white/40 transition-colors">
                            {isConnected ? item.sub : "Connect wallet to access stellar exchange"}
                          </div>
                          {isConnected && walletBalances.length > 0 && (() => {
                            const xlmBalance = walletBalances.find(b => b.asset_code === 'XLM');
                            return xlmBalance ? (
                              <div className="text-[8px] text-lime/60 font-mono mt-1">
                                XLM Balance: {parseFloat(xlmBalance.balance).toFixed(4)}
                              </div>
                            ) : (
                              <div className="text-[8px] text-orange-400/60 font-mono mt-1">
                                No XLM balance found
                              </div>
                            );
                          })()}
                        </div>
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!isConnected ? 'animate-pulse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full border border-${isConnected ? 'lime' : 'orange-400'}/30 flex items-center justify-center`}>
                            <div className={`w-1.5 h-1.5 bg-${isConnected ? 'lime' : 'orange-400'} rounded-full animate-ping`}></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.name === "ARMORY" ? "/Guns" : "/optstore"}
                      className="menu-tab block group relative"
                    >
                      <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex flex-col">
                          <div className="text-[10px] text-lime/40 font-black tracking-[0.3em] mb-1 group-hover:text-lime transition-colors">
                            PROTOCOL {item.id}
                          </div>
                          <div className="text-white font-black text-2xl tracking-[0.15em] transition-all duration-300 group-hover:translate-x-2">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-white/20 font-bold tracking-widest mt-1 group-hover:text-white/40 transition-colors">
                            {item.sub}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-8 h-8 rounded-full border border-lime/30 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-lime rounded-full animate-ping"></div>
                          </div>
                        </div>
                      </div>
                    </Link>)))}
              </div>

              <div className="pt-8 border-t border-white/5 space-y-2">
                <div className="text-[9px] text-white/20 font-mono flex items-center space-x-2">
                  <span className="inline-block w-1 h-1 bg-lime animate-pulse"></span>
                  <span>SIGNAL: STABLE - 24MS</span>
                </div>
                <div className="text-[9px] text-white/20 font-mono">CONNECTION: ENCRYPTED // REGION: STARK-01</div>
              </div>
            </div>



            {/* Right: Combat Control Panel */}
            <div className="flex flex-col space-y-4 w-96 pointer-events-auto">
              {/* Data Suite: Quick Access */}
              <div className="mapbox p-4 grid grid-cols-2 gap-3">
                {[
                  { name: "STORE", icon: "🛒", path: "/optstore", sub: "MARKET" },
                  { name: "CHAT AI", icon: "🤖", action: () => setShowChatUI(true), sub: "COMMAND" },
                  { name: "LEADERBOARD", icon: "🏆", path: "/leaderboard", sub: "RANKING" },
                  { name: "EVENT", icon: "🔥", path: "/optstore", sub: "LIVE" }
                ].map((item) => (
                  item.action ? (
                    <button
                      key={item.name}
                      onClick={item.action}
                      className="relative group overflow-hidden bg-white/5 border border-white/5 p-3 hover:bg-lime/10 transition-all duration-300 text-left"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[7px] text-lime font-black tracking-widest opacity-50 group-hover:opacity-100">DATA_HUB</div>
                          <div className="text-xs font-black text-white group-hover:text-lime">{item.name}</div>
                          <div className="text-[6px] text-white/20 font-bold uppercase">{item.sub}</div>
                        </div>
                        <span className="text-xs opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-0.5 bg-lime/0 group-hover:bg-lime transition-all"></div>
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="relative group overflow-hidden bg-white/5 border border-white/5 p-3 hover:bg-lime/10 transition-all duration-300"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[7px] text-lime font-black tracking-widest opacity-50 group-hover:opacity-100">DATA_HUB</div>
                          <div className="text-xs font-black text-white group-hover:text-lime">{item.name}</div>
                          <div className="text-[6px] text-white/20 font-bold uppercase">{item.sub}</div>
                        </div>
                        <span className="text-xs opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-0.5 bg-lime/0 group-hover:bg-lime transition-all"></div>
                    </Link>
                  )
                ))}
              </div>

              <div className="mapbox p-5 space-y-4">
                {/* Map Reveal */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/30 font-black tracking-widest">MAP SELECTION</span>
                    <span className="text-[10px] text-cyan font-bold tabular-nums">0{mapIndex + 1} / 0{mapNames.length}</span>
                  </div>
                  <div className="map-preview group relative h-36 overflow-hidden">
                    <img
                      src={mapPaths[mapIndex]}
                      className="h-full w-full object-cover transition-all duration-[2s] group-hover:scale-125"
                      alt="Map"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                    {/* Unauthorized Warning Overlay on Map Image */}
                    {!isMapOwned(mapNames[mapIndex]) && (
                      <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 border-2 border-red-500/30">
                        <div className="bg-red-600 text-white text-[10px] font-black px-6 py-1.5 skew-x-[-12deg] shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse mb-2">
                          UNAUTHORIZED AREA
                        </div>
                        <div className="text-[8px] text-white/60 font-black uppercase tracking-[0.2em]">Acquire Clearance in Store</div>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-6 z-10">
                      <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{mapNames[mapIndex]}</h2>
                      <span className={`text-[9px] font-bold tracking-widest ${isMapOwned(mapNames[mapIndex]) ? 'text-lime' : 'text-red-400 opacity-50'}`}>
                        {isMapOwned(mapNames[mapIndex]) ? "READY FOR DEPLOYMENT" : "SECTOR LOCKED"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={leftClick} className="nav-chevron py-3 uppercase text-[10px] font-black tracking-widest">PREVIOUS AREA</button>
                    <button onClick={rightClick} className="nav-chevron py-3 uppercase text-[10px] font-black tracking-widest">NEXT AREA</button>
                  </div>
                </div>

                {/* Mode Logic */}
                <div className="space-y-3">
                  <span className="text-[10px] text-white/30 font-black tracking-widest uppercase">Combat Protocol</span>
                  <div className="flex flex-wrap gap-2">
                    {modes.map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`mode-card px-3 py-2 flex-grow text-center ${gameMode === mode ? 'mode-active' : ''}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Logic */}
                <div className="space-y-3">
                  <span className="text-[10px] text-white/30 font-black tracking-widest uppercase">Deployment window</span>
                  <div className="flex justify-between items-center px-1 space-x-2">
                    {[60, 300, 600].map((time, i) => (
                      <button
                        key={time}
                        onClick={() => setGameTime(time, i + 1)}
                        className={`time-btn flex-1 py-2 text-[10px] font-black tracking-widest ${activeButton === i + 1 ? "time-btn-active" : ""}`}
                      >
                        {time / 60}M
                      </button>
                    ))}
                    <button
                      onClick={() => setGameTime(0, 4)}
                      className={`time-btn flex-1 py-2 text-[10px] font-black tracking-widest ${activeButton === 4 ? "time-btn-active" : ""}`}
                    >
                      CUSTOM
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  className={`playbtm w-full group relative flex flex-col items-center justify-center p-6 ${!isMapOwned(mapNames[mapIndex]) ? "opacity-40 grayscale cursor-not-allowed pointer-events-none" : ""
                    }`}
                  onClick={handleStartGame}
                  disabled={!isMapOwned(mapNames[mapIndex])}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-black italic tracking-tighter">
                      {isMapOwned(mapNames[mapIndex]) ? "START MISSION" : "ACQUIRE CLEARANCE"}
                    </span>
                    {isMapOwned(mapNames[mapIndex]) && (
                      <svg className="w-8 h-8 transform group-hover:translate-x-3 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  {isMapOwned(mapNames[mapIndex]) ? (
                    <div className="absolute top-2 left-6 flex items-center space-x-1 uppercase text-[8px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                      <span>System: Stable</span>
                      <span className="mx-2">|</span>
                      <span>Auth: Verified</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-6 flex items-center space-x-1 uppercase text-[8px] font-bold text-red-400">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      <span>ERROR: UNAUTHORIZED SECTOR</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-8 text-[7px] font-black opacity-30 group-hover:opacity-60">
                    STARK-OS // V2.0.4
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Temporal Authorization Modal - Glass Edition */}
        {customTimeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in zoom-in duration-300">
            <style dangerouslySetInnerHTML={{
              __html: `
            input::-webkit-outer-spin-button,
            input::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type=number] {
              -moz-appearance: textfield;
            }
          `}} />

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/20 w-[450px] relative shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ clipPath: 'polygon(0 40px, 40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)' }}>

              <div className="p-10 space-y-8 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-1 bg-lime shadow-[0_0_15px_#A3FF12]"></div>
                  <h3 className="text-sm font-black text-lime tracking-[0.4em] uppercase font-orbitron">Temporal Config</h3>
                </div>

                <div className="space-y-3">
                  <p className="text-3xl font-black text-white italic uppercase tracking-tighter shadow-white">Match Duration</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] text-white/60 font-black tracking-widest uppercase">System Readiness:</span>
                    <span className="text-[9px] text-lime font-black tracking-widest uppercase animate-pulse">Optimal</span>
                  </div>
                </div>

                <form onSubmit={handleCustomTimeSubmit} className="space-y-8">
                  <div className="relative group">
                    {/* Glowing Input Box */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-focus-within:opacity-100 blur transition-all duration-500"></div>
                    <div className="relative bg-white/[0.05] border border-white/20 group-focus-within:border-white/50 transition-all duration-500 overflow-hidden">
                      <input
                        type="number"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        placeholder="00"
                        className="w-full bg-transparent p-6 text-6xl font-black text-white italic placeholder:opacity-5 focus:outline-none transition-all font-orbitron tabular-nums"
                        autoFocus
                      />
                      <div className="absolute right-6 bottom-6 flex flex-col items-end">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Minutes</span>
                        <div className="w-12 h-[1px] bg-white/40 mt-1"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setCustomTimeModal(false)}
                      className="flex-1 py-4 text-[10px] font-black tracking-[0.4em] uppercase border border-white/30 text-white/50 hover:bg-white/10 hover:text-white transition-all skew-x-[-12deg]"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-4 text-[12px] font-black tracking-[0.4em] uppercase bg-white text-black hover:bg-lime hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] skew-x-[-12deg]"
                    >
                      Authorize
                    </button>
                  </div>
                </form>
              </div>

              {/* Corner Deco */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl opacity-10"></div>
              <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-white/40"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-white/40"></div>
            </div>
          </div>
        )}
        {/* Advanced Settings Modal - Glass Edition */}
        {settingsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/20 w-[550px] relative shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ clipPath: 'polygon(0 40px, 40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)' }}>

              {/* Soft Internal Glow */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.05] to-transparent"></div>

              {/* Header Area */}
              <div className="p-8 bg-white/[0.05] border-b border-white/10">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 border border-lime shadow-[0_0_15px_#A3FF12] flex items-center justify-center rotate-45">
                        <svg className="w-5 h-5 text-lime -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase font-orbitron">Settings</h2>
                      <p className="text-[10px] text-lime font-black tracking-widest opacity-80">STARK-OS // SYSTEM CORE v4.1</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettingsModal(false)}
                    className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/60 hover:bg-white/10 group transition-all"
                  >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-10 space-y-8 relative z-10">
                {/* Audio Controls Section */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <div className={`w-1 h-3 ${soundEnabled ? 'bg-lime' : 'bg-white/20'}`}></div>
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Audio Protocols</span>
                      </div>
                      <span className="text-[10px] text-white/50 uppercase mt-1 ml-3 font-bold">Synchronize system loops and effects</span>
                    </div>
                    <button
                      onClick={() => dispatch(setSoundEnabled(!soundEnabled))}
                      className={`relative w-16 h-8 border transition-all duration-500 ${soundEnabled ? 'border-lime bg-lime/20' : 'border-white/20 bg-white/5'}`}
                    >
                      <div className={`absolute top-1 bottom-1 w-6 transition-all duration-300 ${soundEnabled ? 'right-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'left-1 bg-white/10'}`}></div>
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10"></div>
                    </button>
                  </div>

                  {/* Mobile Interface Section */}
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <div className={`w-1 h-3 ${showMobileControls ? 'bg-cyan' : 'bg-white/20'}`}></div>
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Interface Override</span>
                      </div>
                      <span className="text-[10px] text-white/50 uppercase mt-1 ml-3 font-bold">Manual authorization for on-screen controls</span>
                    </div>
                    <button
                      onClick={() => dispatch(setShowMobileControls(!showMobileControls))}
                      className={`relative w-16 h-8 border transition-all duration-500 ${showMobileControls ? 'border-cyan bg-cyan/20' : 'border-white/20 bg-white/5'}`}
                    >
                      <div className={`absolute top-1 bottom-1 w-6 transition-all duration-300 ${showMobileControls ? 'right-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'left-1 bg-white/10'}`}></div>
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10"></div>
                    </button>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-10 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Environment</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse shadow-[0_0_10px_#A3FF12]"></div>
                        <span className="text-[10px] font-black text-white/80 tracking-tighter uppercase">Primary Host Stable</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 text-right">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Temporal Link</span>
                      <span className="text-[10px] font-black text-cyan tracking-tighter uppercase tabular-nums">SYNCED // 0.00ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 bg-white/[0.05] flex justify-end space-x-4">
                <button
                  onClick={() => setSettingsModal(false)}
                  className="relative px-12 py-3 bg-white hover:bg-lime text-black font-black text-xs uppercase tracking-[0.2em] group overflow-hidden transition-colors"
                  style={{ clipPath: 'polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px)' }}
                >
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  Apply & Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sofia AI Chat Interface Overlay */}
        <AnimatePresence>
          {showChatUI && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] pointer-events-auto bg-black/60 backdrop-blur-md"
            >
              <ChatProvider>
                {/* Sofia 3D Avatar Stage */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <Canvas
                    shadows
                    camera={{ position: [0, 1.5, 3], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    onCreated={({ gl }) => {
                      gl.setClearColor(0x000000, 0);
                    }}
                  >
                    <Suspense fallback={null}>
                      <SofiaExperience />
                    </Suspense>
                  </Canvas>
                </div>

                {/* Sofia UI Layer */}
                <SofiaUI onClose={() => setShowChatUI(false)} />
              </ChatProvider>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Interface Modal */}
        <SwapInterface
          isOpen={showSwapInterface}
          onClose={() => setShowSwapInterface(false)}
        />

        {/* Stake Modal for Game Entry */}
        <StakeModal
          isOpen={showStakeModal}
          onClose={() => setShowStakeModal(false)}
          onStakeComplete={handleStakeSuccess}
          mapName={mapNames[mapIndex]}
        />

        {/* Username Prompt Modal */}
        <UsernamePrompt
          isOpen={showUsernamePrompt}
          onClose={() => setShowUsernamePrompt(false)}
        />
      </div>
    </>
  );
};

export default Lobby;
