'use client';

import React, { useState, useEffect } from 'react';
import { useRace } from '@/context/RaceContext';
import { formatElapsed } from '@/utils/time';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Lock, Unlock } from 'lucide-react';

export default function LiveClock() {
  const { state, startRace, resetRaceTimer, lockInformation, unlockInformation, role } = useRace();
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
    if (!state.isStarted || state.isPaused) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => clearInterval(interval);
  }, [state.isStarted, state.isPaused]);

  let elapsed = 0;
  if (state.isStarted && state.startTime) {
    if (state.endTime) {
      elapsed = state.endTime - state.startTime - state.totalPausedMs;
    } else {
      const activeNow = now > 0 ? now : state.startTime;
      elapsed = Math.max(0, activeNow - state.startTime - state.totalPausedMs);
    }
  }

  const totalFinishedInd = state.individualRunners.filter(r => r.status === 'finished').length;
  const totalInd = state.individualRunners.length;
  
  const totalFinishedTeams = state.teams.filter(t => t.finishedCount === 3).length;
  const totalTeams = state.teams.length;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background glow when race is active */}
      {state.isStarted && (
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {state.isStarted ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            )}
          </span>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            {state.isStarted ? 'Đồng hồ chính đang chạy' : 'Chưa xuất phát'}
          </span>
        </div>

        {/* Lock status pill */}
        <div className="flex items-center gap-1.5">
          {state.isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <Lock className="w-3 h-3" /> Đã khoá thông tin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60">
              <Unlock className="w-3 h-3" /> Chưa khoá thông tin
            </span>
          )}
        </div>
      </div>

      {/* Main Clock Digits */}
      <div className="text-center py-2 sm:py-3">
        <div className="font-mono text-4xl sm:text-6xl font-black tracking-tight text-emerald-400 drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)] select-all">
          {formatElapsed(elapsed, true)}
        </div>
        <p className="text-xs text-slate-400 mt-1">Giờ : Phút : Giây . Tích tắc</p>
      </div>

      {/* Progress counters */}
      <div className="grid grid-cols-2 gap-2 my-3 text-center text-xs">
        <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50">
          <span className="text-slate-400 block mb-0.5">Cá nhân về đích</span>
          <span className="text-base font-bold text-white">
            <span className="text-emerald-400">{totalFinishedInd}</span> / {totalInd} VĐV
          </span>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-2.5 border border-slate-700/50">
          <span className="text-slate-400 block mb-0.5">Đội hoàn thành (3/3)</span>
          <span className="text-base font-bold text-white">
            <span className="text-emerald-400">{totalFinishedTeams}</span> / {totalTeams} Đội
          </span>
        </div>
      </div>

      {/* Action Buttons for Referee */}
      {role === 'referee' && (
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {!state.isStarted ? (
            <button
              onClick={startRace}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all text-base tracking-wide"
            >
              <Play className="w-5 h-5 fill-current" />
              BẮT ĐẦU GIẢI CHẠY (MASS START)
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button
                onClick={resetRaceTimer}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-all"
                title="Đặt lại đồng hồ"
              >
                <RotateCcw className="w-4 h-4" /> Đặt lại
              </button>
              
              <div className="flex-1 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center justify-center text-emerald-400 text-xs font-medium px-3">
                Đang bấm giờ từng người ở tab Bấm Giờ 👇
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
