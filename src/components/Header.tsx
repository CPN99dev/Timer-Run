'use client';

import React, { useState, useEffect } from 'react';
import { useRace } from '@/context/RaceContext';
import {
  Timer,
  Share2,
  Volume2,
  VolumeX,
  Edit2,
  Check,
  Eye,
  Shield,
  KeyRound,
  X,
  AlertCircle
} from 'lucide-react';
import { sound } from '@/utils/audio';

interface HeaderProps {
  onOpenShare: () => void;
}

export default function Header({ onOpenShare }: HeaderProps) {
  const { state, setRaceName, role, setRole, verifyRefereePin } = useRace();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(state.raceName);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Referee PIN verification modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Auto prompt for PIN if opening a referee link on an unauthenticated device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('role') === 'referee' && role === 'viewer') {
        setIsPinModalOpen(true);
      }
    }
  }, [role]);

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

  const handleRoleButtonClick = () => {
    if (role === 'referee') {
      // Allow referee to test viewer mode directly
      setRole('viewer');
    } else {
      // For viewers, prompt for PIN before granting referee privileges
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const success = verifyRefereePin(pinInput);
    if (success) {
      setIsPinModalOpen(false);
      setPinInput('');
    } else {
      setPinError('Mã PIN không đúng. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <>
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
              <span className="hidden sm:inline">Chia sẻ trực tiếp</span>
            </button>

            {/* Role Switcher Pill (Guarded by PIN for spectators) */}
            <button
              onClick={handleRoleButtonClick}
              className={`inline-flex items-center gap-1 text-xs font-bold py-1.5 px-2.5 rounded-xl border transition-all ${
                role === 'referee'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-indigo-950 text-indigo-300 border-indigo-800 hover:bg-indigo-900'
              }`}
              title={role === 'referee' ? 'Bấm để đổi sang chế độ Khán giả xem' : 'Bấm để nhập PIN mở quyền Trọng tài'}
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

      {/* REFEREE PIN AUTHORIZATION MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Xác Thực Trọng Tài</h3>
                <p className="text-xs text-slate-400">Khán giả chỉ xem, cần mã PIN để điều khiển</p>
              </div>
            </div>

            {pinError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Nhập Mã PIN Trọng Tài:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="Nhập 4 số PIN..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono font-bold tracking-widest text-center text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all"
                >
                  Huỷ (Xem tiếp)
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg active:scale-95"
                >
                  Xác Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
