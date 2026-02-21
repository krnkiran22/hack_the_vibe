import React, { useState, useEffect } from "react";
import { usePlayersList, useMultiplayerState, isHost, myPlayer } from "playroomkit";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setPlayerData, setMaxStreak } from "../../store/authslice";
import { setgameid } from "../../store/authslice";

import axios from "axios";

import { useRoom } from "@huddle01/react/hooks";
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

import { useLocalAudio, usePeerIds } from "@huddle01/react/hooks";

import RemotePeer from "./RemotePeer";

const getRoomIdFromURL = () => {
  const hash = window.location.hash;
  const roomId = hash.split("=")[1];
  return roomId;
};

import { MobileLeaderboard } from "./MobileLeaderboard";

export const Leaderboard = () => {
  const dispatch = useDispatch();
  const players = usePlayersList(true);
  const me = myPlayer();
  const [showStats, setShowStats] = useState(false);
  const myHealth = me?.getState("health") ?? 100;
  const [displayHealth, setDisplayHealth] = useState(myHealth);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayHealth(myHealth);
    }, 500);
    return () => clearTimeout(timer);
  }, [myHealth]);

  const [streakNotification, setStreakNotification] = useState(null);
  const currentStreak = me?.getState("killStreak") || 0;

  useEffect(() => {
    if (currentStreak > 1) {
      let title = "KILL STREAK";
      if (currentStreak === 2) title = "DOUBLE KILL";
      if (currentStreak === 3) title = "TRIPLE KILL";
      if (currentStreak === 4) title = "QUADRA KILL";
      if (currentStreak >= 5) title = "RAMPAGE";
      if (currentStreak >= 10) title = "GODLIKE";

      setStreakNotification({
        val: currentStreak,
        title: title
      });

      dispatch(setMaxStreak(currentStreak));

      const timer = setTimeout(() => setStreakNotification(null), 3500);
      return () => clearTimeout(timer);
    } else {
      setStreakNotification(null);
    }
  }, [currentStreak, dispatch]);

  const time = useSelector((state) => state.authslice.selectedTime);
  const [timer, setTimer] = useMultiplayerState("timer");
  const [gameStarted, setGameStarted] = useMultiplayerState("gameStarted", false);
  const [killFeed] = useMultiplayerState("killFeed", []);

  useEffect(() => {
    setRoomId(getRoomIdFromURL());
  }, [window.location.hash]);

  const [roomId, setRoomId] = useState("");
  const playerinfo = useSelector((state) => state.authslice.playerdata);
  const playername = playerinfo?.username;

  const handleButtonClick = () => {
    dispatch(setPlayerData(players));
    dispatch(setgameid(roomId));
  };

  const [muted, setMuted] = useState(false);
  const { peerIds } = usePeerIds();
  const { enableAudio, disableAudio } = useLocalAudio();

  const HUDDLE_API_KEY = import.meta.env.VITE_HUDDLE01_API_KEY || "ak_oxmRVWyaH6FDZoPS";
  const HUDDLE_ROOM_ID = import.meta.env.VITE_HUDDLE01_ROOM_ID || "xpq-dfgv-cpp";

  const createRoomId = async () => {
    try {
      const response = await axios.post(
        "https://api.huddle01.com/api/v1/create-room",
        {
          title: "HackTheVibe-Match-Lobby",
          hostWallets: ["0x324298486F9b811eD5e062275a58363d1B2E93eB"],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": HUDDLE_API_KEY,
          },
        }
      );
      return response.data.data.roomId;
    } catch (error) {
      console.error("[Huddle01] Room creation failed:", error);
      return HUDDLE_ROOM_ID; // Fallback to default room
    }
  };

  const handleJoinRoom = async () => {
    const roomid = await createRoomId();
    const accessToken = new AccessToken({
      apiKey: HUDDLE_API_KEY,
      roomId: roomid,
      role: Role.HOST,
      permissions: {
        admin: true,
        canConsume: true,
        canProduce: true,
        canProduceSources: { mic: true, cam: true, screen: true },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
      },
    });

    const tempToken = await accessToken.toJwt();
    await joinRoom({ roomId: roomid, token: tempToken });
    await enableAudio();
    setMuted(true);
  };

  const { joinRoom } = useRoom({
    onJoin: () => console.info("Joined the room"),
  });

  const handleExitRoom = async () => {
    await disableAudio();
    setMuted(false);
  };

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const handleReturnToLobby = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    navigate("/");
    window.location.reload();
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const message = "Are you sure you want to leave?";
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (timer === 0 && gameStarted) {
      localStorage.setItem("myData", "false");
      handleButtonClick();
      navigate("/result");
    }
  }, [timer, gameStarted]);

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHUD, setShowMobileHUD] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 769); // Match typical tablet/mobile breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {isMobile ? (
        <MobileLeaderboard />
      ) : (
        <div className="fixed w-full top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none fontpop">


          {/* Left Side: Bio-Monitor & Stats Toggle */}
          <div className={`flex flex-col space-y-4 pointer-events-auto transition-all duration-300 ${isMobile ? 'scale-[0.6] origin-top-left -ml-2 -mt-2' : ''}`}>
            {/* Main Bio-Monitor (Local Player Health) */}
            <div className={`stark-hud-card p-5 flex flex-col justify-between h-[180px] min-w-[320px] ${myHealth < 30 ? 'critical' : ''}`}>
              <div className="scanline-overlay"></div>
              <div className="relative z-10 flex justify-between items-start pl-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-sm rotate-45 ${myHealth > 50 ? 'bg-lime' : myHealth > 20 ? 'bg-orange-500' : 'bg-red-500 animate-ping'}`}></div>
                    <span className="text-[10px] text-white/80 font-black tracking-[0.25em] uppercase border-b border-white/10 pb-1">
                      {me?.state.profile?.name || "OPERATIVE"}
                    </span>
                  </div>

                  <div className="flex flex-col mt-1 space-y-0.5">
                    <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">WEAPON SYS // {typeof me?.state.weapon === 'string' ? me.state.weapon : "ASSAULT RIFLE"}</span>
                    <span className="text-[8px] text-lime/80 font-mono tracking-widest uppercase">
                      KINETIC RATIO // {me?.state.kills || 0} : {me?.state.deaths || 0}
                    </span>
                  </div>

                  {me?.getState("killStreak") > 0 && (
                    <div className="flex items-center gap-2 bg-black/40 px-2 py-1 mt-2 border-l-2 border-lime w-max">
                      <span className="text-[10px] text-lime font-black tracking-widest animate-streak drop-shadow-[0_0_5px_rgba(163,255,18,0.8)]">KILL STREAK x{me.getState("killStreak")}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-4xl font-black italic leading-none drop-shadow-lg ${myHealth > 50 ? 'text-white' : myHealth > 20 ? 'text-orange-500' : 'text-red-500 animate-pulse'}`}>{Math.round(myHealth)}%</span>
                  <span className={`text-[7px] font-bold tracking-widest uppercase font-mono mt-1 bg-black/20 px-1 rounded ${myHealth > 50 ? 'text-white/40' : myHealth > 20 ? 'text-orange-500/80' : 'text-red-500'}`}>SYSTEM: {myHealth > 50 ? 'ONLINE' : myHealth > 20 ? 'WARNING' : 'FAILING'}</span>
                </div>
              </div>

              {/* Dual-Phase Energy Rail */}
              <div className="relative z-10 mt-1 pl-3 w-full pr-1">
                <div className="h-4 bg-gray-900/80 relative skew-x-[-15deg] border border-white/10 overflow-hidden shadow-inner backdrop-blur-sm">
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10%_100%] pointer-events-none"></div>
                  {/* Damage Memory (Red flash) */}
                  <div
                    className="absolute inset-0 bg-red-600 transition-all duration-300 ease-out"
                    style={{ width: `${displayHealth}%`, opacity: 0.8 }}
                  />
                  {/* Core Energy (Green/Orange/Red Gradient) */}
                  <div
                    className={`absolute inset-0 transition-all duration-500 ease-out ${myHealth > 50 ? 'bg-gradient-to-r from-lime-600 to-lime-400 shadow-[0_0_10px_rgba(163,255,18,0.3)]' :
                      myHealth > 20 ? 'bg-gradient-to-r from-orange-600 to-yellow-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' :
                        'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                      }`}
                    style={{ width: `${myHealth}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
                  </div>
                </div>
                {/* Tick Marks */}
                <div className="flex justify-between mt-1 px-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[1px] h-1 bg-white/20"></div>
                  ))}
                </div>

                {/* Combat Metrics */}
                <div className="flex items-center gap-4 mt-4 justify-between px-1">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-white/5 skew-x-[-10deg]">
                    <span className="text-[10px] text-lime font-black tracking-widest uppercase skew-x-[10deg]">KILLS</span>
                    <span className="text-xl text-white font-black italic skew-x-[10deg]">{me?.state.kills || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-white/5 skew-x-[-10deg]">
                    <span className="text-[10px] text-red-500 font-black tracking-widest uppercase skew-x-[10deg]">DEATHS</span>
                    <span className="text-xl text-white font-black italic skew-x-[10deg]">{me?.state.deaths || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-white/5 skew-x-[-10deg]">
                    <span className="text-[10px] text-yellow-400 font-black tracking-widest uppercase skew-x-[10deg]">STREAK</span>
                    <span className="text-xl text-white font-black italic skew-x-[10deg]">{me?.getState("killStreak") || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Stats Menu Toggle */}
            <div className="flex items-center pl-1">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-5 py-2 bg-black/60 border border-white/10 hover:bg-white/10 hover:border-lime/50 transition-all flex items-center space-x-3 group backdrop-blur-md skew-x-[-10deg]"
              >
                <div className="skew-x-[10deg] flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 bg-white/40 transition-colors ${showStats ? 'bg-lime animate-pulse' : ''}`}></div>
                  <span className="text-[9px] font-black text-white/70 tracking-[0.2em] uppercase group-hover:text-white transition-colors">
                    {showStats ? 'TERMINATE FEED' : 'SQUAD DATA LINK'}
                  </span>
                </div>
              </button>
            </div>

            {/* Collapsible Squad Roster */}
            {showStats && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300 pl-1">
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  <div className="w-1 h-1 bg-lime"></div>
                  <div className="h-[1px] w-10 bg-lime"></div>
                  <span className="text-[8px] text-lime font-mono tracking-widest">ACTIVE UNITS: {players.length}</span>
                </div>

                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-black/80 border-l-2 p-2 pr-4 flex items-center gap-3 min-w-[260px] backdrop-blur-sm transition-transform hover:translate-x-1"
                    style={{ borderLeftColor: player.state.profile?.color }}
                  >
                    <div className="relative">
                      <img
                        src={player.state.profile?.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                        className="w-8 h-8 opacity-80 border border-white/10"
                        alt=""
                      />
                      {player.state.health <= 0 && <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center font-black text-[10px] text-white">KIA</div>}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1">
                        <h2 className="font-bold text-[10px] tracking-wider uppercase text-white/90 truncate max-w-[100px]">
                          {player.state.profile.name}
                        </h2>
                        <span className={`text-[9px] font-mono font-bold ${player.state.health > 50 ? 'text-lime' : player.state.health > 20 ? 'text-orange-500' : 'text-red-500'}`}>{Math.round(player.state.health)}%</span>
                      </div>

                      {/* Mini Health Bar */}
                      <div className="h-1 bg-white/10 w-full relative overflow-hidden">
                        <div
                          className={`absolute inset-0 transition-all duration-500 ${player.state.health > 50 ? 'bg-lime' : player.state.health > 20 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${player.state.health}%` }}
                        />
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-sm">
                          <span className="text-[7px] text-lime font-bold">KILL</span>
                          <span className="text-[9px] font-black text-white">{player.state.kills}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-sm">
                          <span className="text-[7px] text-red-500 font-bold">DEATH</span>
                          <span className="text-[9px] font-black text-white">{player.state.deaths}</span>
                        </div>
                        {player.state.killStreak >= 3 && (
                          <div className="ml-auto bg-lime/20 border border-lime/30 px-1.5 py-0.5">
                            <span className="text-[8px] font-black text-lime animate-streak block leading-none tracking-tighter">STREAK {player.state.killStreak}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center: Mission Clock */}
          {/* Center: Mission Clock */}
          {/* Center: Mission Clock */}
          <div className={`flex flex-col items-center pointer-events-auto relative transition-all duration-300 ${isMobile ? 'scale-[0.6] origin-top -mt-2' : ''}`}>
            {/* Desktop Premium Clock (Available on Mobile too, just scaled) */}
            <div className="mission-clock-premium">
              <span className="text-[10px] absolute -top-6 left-1/2 -translate-x-1/2 tracking-[1em] text-white/20 whitespace-nowrap font-black">MISSION_CHRONO</span>
              <div className={`text-4xl font-black italic tracking-tighter ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatTime(timer ?? time ?? 60)}
              </div>
              <div className="h-0.5 w-full bg-white/10 mt-1 relative overflow-hidden rounded-full">
                <div className={`absolute inset-0 ${timer < 60 ? 'bg-red-500' : 'bg-lime'}`} style={{ width: `${(timer / (time || 60)) * 100}%` }}></div>
              </div>
            </div>

            {/* HIGH-IMPACT STREAK NOTIFICATION */}
            {streakNotification && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center w-max animate-streak-title pointer-events-none">
                <div className="relative">
                  <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ WebkitTextStroke: '2px black' }}>
                    {streakNotification.title}
                  </h1>
                  <h1 className="absolute inset-0 text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-transparent to-lime opacity-50 blur-sm" style={{ WebkitTextStroke: '2px black' }}>
                    {streakNotification.title}
                  </h1>
                </div>
                <div className="bg-black/80 px-4 py-1 skew-x-[-10deg] border border-lime shadow-[0_0_20px_rgba(163,255,18,0.4)] mt-[-10px] z-10">
                  <span className="text-2xl font-black text-lime tracking-[0.5em] italic drop-shadow-md">STREAK x{streakNotification.val}</span>
                </div>
              </div>
            )}
          </div>


          {/* Right Side: Secondary Vital Signs & Comms */}
          <div className={`flex flex-col items-end space-y-4 pointer-events-auto relative transition-all duration-300 ${isMobile ? 'scale-[0.6] origin-top-right -mr-2 -mt-2' : ''}`}>

            {/* Kill Feed - Stark Tactical Log */}
            <div className="absolute top-10 right-[105%] flex flex-col items-end gap-2 w-[300px] pointer-events-none">
              {killFeed.slice(-4).reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 bg-black/80 border-r-2 border-lime p-2 pr-3 skew-x-[-12deg] shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-toast-slide-in"
                  style={{ animationFillMode: 'forwards' }}
                >
                  <span className="text-[10px] font-black text-lime uppercase skew-x-[12deg] tracking-wider drop-shadow-md">{event.killer}</span>
                  <span className="text-[8px] font-bold text-white/40 skew-x-[12deg] italic px-1">killed</span>
                  <span className="text-[10px] font-black text-red-500 uppercase skew-x-[12deg] tracking-wider drop-shadow-md">{event.victim}</span>
                </div>
              ))}
            </div>

            {/* Systems Panel */}
            <div className="stark-hud-card right-aligned p-5 pl-4 flex flex-col justify-between items-end h-[180px] min-w-[340px] relative overflow-hidden group">
              <div className="scanline-overlay"></div>

              {/* Header */}
              <div className="relative z-10 flex items-center justify-end gap-2 border-b border-white/10 pb-2 w-full pr-3">
                <span className="text-[12px] text-white/90 font-black tracking-[0.2em] uppercase group-hover:text-cyan-400 transition-colors drop-shadow-md">SYSTEMS & COMMS</span>
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>

              {/* Dynamic Status Readout */}
              <div className="relative z-10 flex flex-col items-end w-full space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-white/40 font-mono tracking-widest uppercase">SIGNAL STRENGTH</span>
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-2 bg-cyan-500/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-0.5 h-2 bg-cyan-500/60 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-0.5 h-2 bg-cyan-500/80 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-0.5 h-2 bg-cyan-500 animate-pulse" style={{ animationDelay: '450ms' }}></div>
                  </div>
                </div>
                <div className={`text-[9px] font-black tracking-tighter uppercase px-1.5 py-0.5 border ${muted ? 'text-cyan-400 border-cyan-500/30 bg-cyan-900/20' : 'text-white/50 border-white/10'}`}>
                  {muted ? 'COMMS: ONLINE' : 'COMMS: STANDBY'}
                </div>
              </div>

              {/* Control Matrix */}
              <div className="relative z-10 flex flex-col gap-2 mt-1 w-full">
                <div className="flex gap-2 justify-end">
                  {!muted ? (
                    <button
                      type="button"
                      className="bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/50 text-[9px] font-black tracking-widest uppercase px-4 py-2 transition-all skew-x-[-10deg] hover:skew-x-[-5deg] hover:scale-105 active:scale-95 text-white flex-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      onClick={handleJoinRoom}
                    >
                      LINK AUDIO
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="bg-red-500/10 hover:bg-red-500/30 border border-red-500/50 text-[9px] font-black tracking-widest uppercase px-4 py-2 transition-all skew-x-[-10deg] hover:skew-x-[-5deg] hover:scale-105 active:scale-95 text-white flex-1 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      onClick={handleExitRoom}
                    >
                      UNLINK
                    </button>
                  )}

                  <button
                    className="bg-white/5 hover:bg-white/20 border border-white/10 p-2 transition-all hover:border-lime/50 group/fs relative overflow-hidden"
                    onClick={() => {
                      if (document.fullscreenElement) document.exitFullscreen();
                      else document.documentElement.requestFullscreen();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-white/60 group-hover/fs:text-lime transition-colors relative z-10">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full bg-red-600/10 hover:bg-red-600/30 border border-red-500/30 text-[9px] font-black tracking-[0.2em] uppercase py-2 transition-all hover:border-red-500/80 hover:text-white text-white group/exit relative overflow-hidden"
                  onClick={handleReturnToLobby}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-hover/exit:animate-pulse">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    ABORT MISSION
                  </span>
                  <div className="absolute inset-0 bg-red-600/10 translate-x-[-100%] group-hover/exit:translate-x-0 transition-transform duration-300"></div>
                </button>
              </div>
            </div>

            {/* Peer List */}
            <div className="grid gap-2 text-right">
              {peerIds.map((peerId) => peerId ? <RemotePeer key={peerId} peerId={peerId} /> : null)}
            </div>
          </div>
        </div>
      )}

      {/* Mission Abort Confirmation Modal */}
      {
        showExitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
            <div className="stark-hud-card p-8 flex flex-col items-center gap-6 min-w-[400px] border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative">
              <div className="scanline-overlay"></div>

              <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black italic tracking-widest text-white uppercase mt-4 drop-shadow-lg">ABORT MISSION?</h2>
                <p className="text-xs text-white/60 font-mono tracking-wider max-w-[280px]">
                  CONFIRMING THIS ACTION WILL TERMINATE YOUR CONNECTION AND RETURN YOU TO BASE.
                </p>
              </div>

              <div className="flex gap-4 w-full relative z-10 mt-2">
                <button
                  onClick={cancelExit}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-lime/50 text-white font-black tracking-widest py-3 skew-x-[-10deg] transition-all hover:scale-105 active:scale-95 group"
                >
                  <span className="skew-x-[10deg] block group-hover:text-lime transition-colors">RESUME</span>
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 font-black tracking-widest py-3 skew-x-[-10deg] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] group"
                >
                  <span className="skew-x-[10deg] block text-white group-hover:text-red-200 transition-colors">CONFIRM ABORT</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
