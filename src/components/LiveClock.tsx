'use client';

import React, { useState, useEffect } from 'react';
import { useRace } from '@/context/RaceContext';
import { formatElapsed, formatTimeOfDay } from '@/utils/time';
import { Play, RotateCcw, Lock, Unlock, User, Users, Flag, Sparkles } from 'lucide-react';

export default function LiveClock() {
  const {
    state,
    startRace,
    startIndividualRace,
    startTeamRace,
    resetRaceTimer,
    role
  } = useRace();

  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
    if (!state.isStarted || state.isPaused) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => clearInterval(interval);
  }, [state.isStarted, state.isPaused]);

  // Overall main clock
  let overallElapsed = 0;
  if (state.isStarted && state.startTime) {
    if (state.endTime) {
      overallElapsed = state.endTime - state.startTime - state.totalPausedMs;
    } else {
      const activeNow = now > 0 ? now : state.startTime;
      overallElapsed = Math.max(0, activeNow - state.startTime - state.totalPausedMs);
    }
  }

  // Individual category clock
  let indElapsed = 0;
  if (state.individualStarted && state.individualStartTime) {
    if (state.individualEndTime) {
      indElapsed = state.individualEndTime - state.individualStartTime - state.totalPausedMs;
    } else {
      const activeNow = now > 0 ? now : state.individualStartTime;
      indElapsed = Math.max(0, activeNow - state.individualStartTime - state.totalPausedMs);
    }
  }

  // Team category clock
  let teamElapsed = 0;
  if (state.teamStarted && state.teamStartTime) {
    if (state.teamEndTime) {
      teamElapsed = state.teamEndTime - state.teamStartTime - state.totalPausedMs;
    } else {
      const activeNow = now > 0 ? now : state.teamStartTime;
      teamElapsed = Math.max(0, activeNow - state.teamStartTime - state.totalPausedMs);
    }
  }

  const totalFinishedInd = state.individualRunners.filter(r => r.status === 'finished').length;
  const totalInd = state.individualRunners.length;
  
  const totalFinishedTeams = state.teams.filter(t => t.finishedCount === 3).length;
  const totalTeams = state.teams.length;

  const isAllCompleted = Boolean(state.isStarted && state.endTime);

  useEffect(() => {
    if (isAllCompleted) {
      import('canvas-confetti').then((confettiModule) => {
        confettiModule.default({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      });
    }
  }, [isAllCompleted]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background glow when race is active */}
      {state.isStarted && !isAllCompleted && (
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {isAllCompleted && (
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Status Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isAllCompleted ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            ) : state.isStarted ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            )}
          </span>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            {isAllCompleted
              ? '🏁 Đã Dừng Tự Động (Tất cả VĐV đã về đích)'
              : state.isStarted
              ? 'Đồng hồ đang tính giờ'
              : 'Chưa xuất phát'}
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
          {formatElapsed(overallElapsed, true)}
        </div>
        <p className="text-xs text-slate-400 mt-1">Đồng hồ tổng (Giờ : Phút : Giây . Tích tắc)</p>
      </div>

      {/* SUB-CLOCKS FOR INDEPENDENT CATEGORY STARTS */}
      {(state.individualStarted || state.teamStarted) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5 pt-1 border-t border-slate-800/80">
          {/* Individual Category Timer */}
          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-300 block">Đồng Hồ Cá Nhân</span>
                <span className="text-[10px] text-slate-500">
                  {state.individualStarted
                    ? `Xuất phát: ${formatTimeOfDay(state.individualStartTime)}`
                    : 'Chưa xuất phát'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm sm:text-base font-black text-emerald-400">
                {state.individualStarted ? formatElapsed(indElapsed, true) : '--:--.--'}
              </span>
              <span className="text-[10px] block text-slate-400">
                {state.individualEndTime ? '🏁 Đã dừng' : state.individualStarted ? 'Đang chạy' : 'Chờ lệnh'}
              </span>
            </div>
          </div>

          {/* Team Category Timer */}
          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-950/60 text-teal-400 border border-teal-800">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-300 block">Đồng Hồ Đồng Đội (3 người)</span>
                <span className="text-[10px] text-slate-500">
                  {state.teamStarted
                    ? `Xuất phát: ${formatTimeOfDay(state.teamStartTime)}`
                    : 'Chưa xuất phát'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm sm:text-base font-black text-teal-300">
                {state.teamStarted ? formatElapsed(teamElapsed, true) : '--:--.--'}
              </span>
              <span className="text-[10px] block text-slate-400">
                {state.teamEndTime ? '🏁 Đã dừng' : state.teamStarted ? 'Đang chạy' : 'Chờ lệnh'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress counters */}
      <div className="grid grid-cols-2 gap-2 my-2 text-center text-xs">
        <div className="bg-slate-800/70 rounded-xl p-2 border border-slate-700/50">
          <span className="text-slate-400 block mb-0.5">Cá nhân về đích</span>
          <span className="text-sm sm:text-base font-bold text-white">
            <span className="text-emerald-400">{totalFinishedInd}</span> / {totalInd} VĐV
          </span>
        </div>
        <div className="bg-slate-800/70 rounded-xl p-2 border border-slate-700/50">
          <span className="text-slate-400 block mb-0.5">Đội hoàn thành (3/3)</span>
          <span className="text-sm sm:text-base font-bold text-white">
            <span className="text-emerald-400">{totalFinishedTeams}</span> / {totalTeams} Đội
          </span>
        </div>
      </div>

      {/* START CONTROL CONSOLE FOR REFEREE */}
      {role === 'referee' && (
        <div className="pt-2 space-y-2">
          {/* 1. If not all categories started, show options to start */}
          {(!state.individualStarted || !state.teamStarted) && (
            <div className="space-y-1.5">
              {/* Option A: Mass Start (Common start for both categories) - KEEPING IT AS REQUESTED */}
              {!state.isStarted && (
                <button
                  onClick={startRace}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition-all text-sm sm:text-base tracking-wide"
                >
                  <Play className="w-5 h-5 fill-current" />
                  XUẤT PHÁT CHUNG (TOÀN BỘ CẢ 2 BẢNG)
                </button>
              )}

              {/* Option B & C: Separate Starts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!state.individualStarted ? (
                  <button
                    onClick={startIndividualRace}
                    className="flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs shadow-md border border-emerald-600/50"
                  >
                    <User className="w-4 h-4" />
                    XUẤT PHÁT BẢNG CÁ NHÂN
                  </button>
                ) : (
                  <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Bảng Cá Nhân đã xuất phát
                  </div>
                )}

                {!state.teamStarted ? (
                  <button
                    onClick={startTeamRace}
                    className="flex items-center justify-center gap-1.5 bg-teal-800 hover:bg-teal-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs shadow-md border border-teal-600/50"
                  >
                    <Users className="w-4 h-4" />
                    XUẤT PHÁT BẢNG ĐỒNG ĐỘI (3 NGƯỜI)
                  </button>
                ) : (
                  <div className="bg-teal-950/80 border border-teal-800 text-teal-400 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Bảng Đồng Đội đã xuất phát
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset button when race has started */}
          {state.isStarted && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={resetRaceTimer}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold py-2 px-3.5 rounded-xl border border-slate-700 transition-all shrink-0"
                title="Đặt lại đồng hồ"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
              </button>

              {isAllCompleted ? (
                <div className="flex-1 bg-amber-950/50 border border-amber-700/60 rounded-xl flex items-center justify-center text-amber-300 text-xs font-semibold px-3 py-1.5 text-center">
                  🎉 Tất cả VĐV đã về đích! Đồng hồ đã tự động dừng.
                </div>
              ) : (
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 text-xs font-medium px-3 py-1.5">
                  Bấm giờ từng người ở tab <strong className="text-emerald-400 ml-1">Bấm Giờ 👇</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
