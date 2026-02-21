import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const loadingQuotes = [
    "In the midst of chaos, there is also opportunity.",
    "Victory belongs to the most persevering.",
    "The supreme art of war is to subdue the enemy without fighting.",
    "Know thy self, know thy enemy.",
    "Courage is not the absence of fear, but the triumph over it.",
    "The best warrior is never angry.",
    "To win without fighting is the best victory.",
    "In battle, there are not more than two methods of attack.",
    "The opportunity of defeating the enemy is provided by the enemy himself.",
    "All warfare is based on deception.",
    "The greatest victory is that which requires no battle.",
    "Appear weak when you are strong, and strong when you are weak.",
    "Let your plans be dark and impenetrable as night.",
    "Supreme excellence consists of breaking the enemy's resistance without fighting.",
    "Victorious warriors win first and then go to war."
];

const introVideo = "/loading_images/I_need_looping_202602072235_b73bi1.mp4";
const firstImage = "/loading_images/image.png";

export const LoadingScreen = ({ onFinished }) => {
    const [progress, setProgress] = useState(0);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    // Initial delay of 250ms
    useEffect(() => {
        const timer = setTimeout(() => setHasStarted(true), 250);
        return () => clearTimeout(timer);
    }, []);

    // Phase control: Video only, immediate start
    useEffect(() => {
        setShowVideo(true);
    }, []);

    // Progress simulation (Total ~2s)
    useEffect(() => {
        if (!hasStarted || isComplete) return;

        // 20ms * 100 = 2000ms (2 seconds)
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsComplete(true);
                    return 100;
                }
                const increment = Math.random() > 0.5 ? 2 : 1;
                return Math.min(prev + increment, 100);
            });
        }, 18); // Fast updates for 2s total duration

        return () => clearInterval(interval);
    }, [hasStarted, isComplete]);

    // Quote rotation every 4s
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % loadingQuotes.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Handle completion animation
    useEffect(() => {
        if (isComplete) {
            const timer = setTimeout(() => {
                if (onFinished) onFinished();
            }, 1500); // Match fadeOutLoading duration
            return () => clearTimeout(timer);
        }
    }, [isComplete, onFinished]);

    const getLoadingMessage = (p) => {
        if (p < 15) return "INITIALIZING BATTLE SYSTEMS";
        if (p < 30) return "CALIBRATING WEAPONS";
        if (p < 45) return "LOADING TACTICAL DATA";
        if (p < 60) return "PREPARING BATTLE FORMATIONS";
        if (p < 75) return "SYNCHRONIZING COMBAT PROTOCOLS";
        if (p < 90) return "ESTABLISHING BATTLEFIELD";
        if (p === 100) return "DEPLOYMENT INITIATED";
        return "READY FOR DEPLOYMENT";
    };

    return (
        <div className={`fixed inset-0 z-[10000] bg-black overflow-hidden ${isComplete ? 'loading-complete' : ''}`}>
            {/* Cinematic Letterbox */}
            <div className="letterbox top"></div>
            <div className="letterbox bottom"></div>

            {/* Separate effects container */}
            <div id="effects-container" className="fixed inset-0 pointer-events-none">

                {/* --- Dynamic Background Flow --- */}
                <AnimatePresence mode="wait">
                    {/* Tactical Video Phase - Always Visible */}
                    <motion.div
                        key="intro-video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-0 bg-black"
                    >
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60 grayscale brightness-75"
                        >
                            <source src={introVideo} type="video/mp4" />
                        </video>
                    </motion.div>
                </AnimatePresence>

                {/* Overlays (Keep Old Tech Style) */}
                <div className="cinematic-overlay z-20"></div>
                <div className="tv-effect z-30"></div>
                <div className="scanlines z-40"></div>
                <div className="vignette z-50"></div>
                <div className="glitch-line z-[60]"></div>
            </div>

            <div id="unity-loading-bar" className="fixed inset-0 flex items-center justify-center z-[100]">
                <div className="w-[800px] px-8 py-6 text-center">
                    {/* Game Title */}
                    <h1 className="text-7xl font-bold text-white mb-12 tracking-widest uppercase text-center w-full block" style={{ animation: 'flicker 4s ease-in-out infinite' }}>
                        STELLAR STRIKE
                    </h1>

                    {/* Quote */}
                    <div className="h-16 flex items-center justify-center mb-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={quoteIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-white/80 text-2xl italic tracking-wide"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                "{loadingQuotes[quoteIndex]}"
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative max-w-2xl mx-auto">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden mb-4 border border-white/5">
                            <div
                                className="h-full bg-white rounded-full relative transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                style={{ width: `${progress}%` }}
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    style={{ animation: 'shine 1.5s infinite' }}
                                ></div>
                            </div>
                        </div>

                        {/* Loading Message */}
                        <div className="flex justify-between items-center px-1">
                            <div
                                className="text-white/60 text-sm tracking-[0.2em] uppercase font-mono"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {getLoadingMessage(progress)}
                            </div>
                            <div
                                className="text-white/80 text-xl font-bold font-mono"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {progress}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
