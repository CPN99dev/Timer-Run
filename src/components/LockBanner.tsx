'use client';

import React from 'react';
import { useRace } from '@/context/RaceContext';
import { Lock, Unlock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LockBanner() {
  const { state, lockInformation, unlockInformation, role } = useRace();

  if (role !== 'referee') return null;

  return (
    <div
      className={`rounded-xl p-3.5 border transition-all mb-4 ${
        state.isLocked
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
          : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          {state.isLocked ? (
            <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-amber-900/60 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold tracking-tight">
              {state.isLocked ? 'Thông Tin Đã Chốt & Khoá An Toàn' : 'Chưa Khoá Danh Sách VĐV'}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {state.isLocked
                ? 'Đã bảo vệ danh sách chống bấm nhầm/ghi đè. Có thể bấm giờ xuất phát an tâm.'
                : 'Hãy điền tên, số BIB xong rồi bấm "Khoá thông tin" để tránh bấm nhầm khi thi đấu.'}
            </p>
          </div>
        </div>

        <div className="self-end sm:self-center shrink-0">
          {state.isLocked ? (
            <button
              onClick={unlockInformation}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" /> Mở khoá để sửa
            </button>
          ) : (
            <button
              onClick={lockInformation}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-950/30 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5 fill-current" /> KHOÁ THÔNG TIN NGAY
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
