import React, { useState } from 'react';
import { useWalletStore } from '../store/walletStore';

export default function UsernamePrompt({ isOpen, onClose }) {
  const { setUsername } = useWalletStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter a name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }
    
    setUsername(trimmedName);
    setName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black border border-lime/30 shadow-[0_0_40px_rgba(163,255,18,0.4)] p-8">
        <div style={{ clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' }}>
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-lime tracking-widest mb-2">
              WELCOME SOLDIER
            </h2>
            <p className="text-sm text-white/60 uppercase tracking-wider">
              Enter your battle name
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 font-bold uppercase tracking-widest mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-lime/50 text-white text-lg font-bold uppercase tracking-wider outline-none transition-all"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-xs text-red-400 font-bold uppercase tracking-wider">
                  {error}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-lime/20 hover:bg-lime/30 border border-lime/50 text-lime font-black uppercase tracking-widest transition-all"
                style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
              >
                Confirm
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-3 bg-white/5 border border-white/10">
            <p className="text-xs text-white/40 text-center">
              This name will be displayed in your profile and leaderboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
