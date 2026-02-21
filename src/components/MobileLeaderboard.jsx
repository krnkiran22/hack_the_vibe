import React, { useState, useEffect } from "react";
import { usePlayersList, useMultiplayerState, isHost, myPlayer } from "playroomkit";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setPlayerData, setMaxStreak, setgameid } from "../../store/authslice";

// A simplified, mobile-optimized version of the HUD
// Uses minimal styling, smaller fonts, and corner-anchored elements to prevent blocking the game view.

export const MobileLeaderboard = () => {
    const dispatch = useDispatch();
    const players = usePlayersList(true);
    const me = myPlayer();
    const myHealth = me?.getState("health") ?? 100;

    const [timer] = useMultiplayerState("timer");
    const [killFeed] = useMultiplayerState("killFeed", []);

    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const navigate = useNavigate();

    const handleReturnToLobby = () => setShowExitConfirmation(true);
    const confirmExit = () => {
        navigate("/");
        window.location.reload();
    };
    const cancelExit = () => setShowExitConfirmation(false);

    const formatTime = (seconds) => {
        if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return (
        <>
            <div className="fixed inset-0 pointer-events-none fontpop z-10 flex flex-col justify-between p-2 select-none">

                {/* Top Row: Info Bar */}
                <div className="flex justify-between items-start w-full">

                    {/* Top Left: Health & Profile */}
                    <div className="pointer-events-auto bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-2 flex flex-col gap-1 min-w-[120px]">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${myHealth > 50 ? 'bg-lime' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-[10px] text-white font-black truncate max-w-[80px]">{me?.state.profile?.name || "OP"}</span>
                        </div>
                        {/* Health Bar */}
                        <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`absolute inset-0 transition-all duration-300 ${myHealth > 50 ? 'bg-lime' : 'bg-red-500'}`} style={{ width: `${myHealth}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-white/60">
                            <span>HP {Math.round(myHealth)}%</span>
                            <span>K/D {me?.state.kills || 0}/{me?.state.deaths || 0}</span>
                        </div>
                    </div>

                    {/* Top Center: Timer (Minimal) */}
                    <div className={`pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 ${timer < 60 ? 'border-red-500/50' : ''}`}>
                        <span className={`text-lg font-black italic tracking-tighter ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {formatTime(timer ?? 0)}
                        </span>
                    </div>

                    {/* Top Right: Mini Killfeed & Menu */}
                    <div className="flex flex-col items-end gap-2 pointer-events-auto">
                        <button
                            onClick={handleReturnToLobby}
                            className="p-2 bg-red-500/20 border border-red-500/50 rounded-md active:scale-95 transition-transform"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Kill Feed Overlay (Top Right Below Menu) */}
                <div className="absolute top-14 right-2 flex flex-col items-end gap-1 w-[200px] pointer-events-none opacity-80">
                    {killFeed.slice(-3).reverse().map((event) => (
                        <div key={event.id} className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[8px] animate-toast-slide-in">
                            <span className="text-lime font-bold">{event.killer}</span>
                            <span className="text-white/50">killed</span>
                            <span className="text-red-500 font-bold">{event.victim}</span>
                        </div>
                    ))}
                </div>

                {/* Bottom stats or notifications can go here if needed, but keeping it empty for controls */}

                {/* Streak Notification - Center Screen Top */}
                {me?.getState("killStreak") > 1 && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none animate-streak-title">
                        <div className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-md" style={{ WebkitTextStroke: '1px black' }}>
                            {me?.getState("killStreak")} STREAK
                        </div>
                    </div>
                )}

            </div>

            {/* Mobile Abort Modal */}
            {showExitConfirmation && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 flex flex-col items-center gap-4 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-black text-white">LEAVE GAME?</h2>
                        <p className="text-sm text-zinc-400 text-center">Your progress will not be saved.</p>
                        <div className="flex gap-4 w-full">
                            <button onClick={cancelExit} className="flex-1 py-3 bg-zinc-800 rounded-lg text-white font-bold active:scale-95">CANCEL</button>
                            <button onClick={confirmExit} className="flex-1 py-3 bg-red-600 rounded-lg text-white font-bold active:scale-95">LEAVE</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
