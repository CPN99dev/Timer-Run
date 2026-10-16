'use client';

import React, { useState } from 'react';
import { useRace } from '@/context/RaceContext';
import {
  Timer,
  Share2,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Edit2,
  Check,
  Eye,
  Shield
} from 'lucide-react';
import { sound } from '@/utils/audio';

interface HeaderProps {
  onOpenShare: () => void;
}

export default function Header({ onOpenShare }: HeaderProps) {
  const { state, setRaceName, role, setRole } = useRace();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(state.raceName);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempTitle.trim()) {
      setRaceName(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Race Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-500/20 shrink-0">
            <Timer className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditingTitle && !state.isLocked ? (
              <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  className="bg-slate-950 border border-emerald-500 rounded-lg px-2 py-0.5 text-xs sm:text-sm font-bold text-white focus:outline-none w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  {state.raceName}
                </h1>
                {!state.isLocked && role === 'referee' && (
                  <button
                    onClick={() => {
                      setTempTitle(state.raceName);
                      setIsEditingTitle(true);
                    }}
                    className="text-slate-500 hover:text-slate-300 p-0.5 shrink-0"
                    title="Đổi tên giải chạy"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono text-emerald-400 font-semibold">
                Phòng: {state.roomCode}
              </span>
              <span>•</span>
              <span>2 Bảng: Cá nhân & Đội (3 người)</span>
            </div>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Share Modal Trigger */}
          <button
            onClick={onOpenShare}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-2.5 sm:px-3 rounded-xl transition-all"
            title="Chia sẻ link & mã QR cho khán giả cùng xem trực tiếp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Chia sẻ xem trực tiếp</span>
          </button>

          {/* Role Switcher Pill */}
          <button
            onClick={() => setRole(role === 'referee' ? 'viewer' : 'referee')}
            className={`inline-flex items-center gap-1 text-xs font-bold py-1.5 px-2.5 rounded-xl border transition-all ${
              role === 'referee'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-indigo-950 text-indigo-300 border-indigo-800'
            }`}
            title={role === 'referee' ? 'Đổi sang chế độ Khán giả xem' : 'Đổi sang chế độ Trọng tài'}
          >
            {role === 'referee' ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Trọng Tài</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Khán Giả</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
