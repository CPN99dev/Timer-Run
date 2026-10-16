'use client';

import React, { useState } from 'react';
import { RaceProvider, useRace } from '@/context/RaceContext';
import Header from '@/components/Header';
import LiveClock from '@/components/LiveClock';
import LockBanner from '@/components/LockBanner';
import SetupTab from '@/components/SetupTab';
import TimerTab from '@/components/TimerTab';
import LeaderboardTab from '@/components/LeaderboardTab';
import ShareModal from '@/components/ShareModal';
import { ActiveTab } from '@/types/race';
import { UserCheck, Timer, Trophy, Shield, Eye } from 'lucide-react';

function RaceAppContent() {
  const { state, role } = useRace();
  const [activeTab, setActiveTab] = useState<ActiveTab>('timing');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // If viewing as spectator, default tab to leaderboard or timing
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 sm:pb-12">
      {/* Top Header */}
      <Header onOpenShare={() => setIsShareOpen(true)} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-6 pt-4 space-y-4 flex-1">
        {/* Role Notice for Spectators */}
        {role === 'viewer' && (
          <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-xl p-3 text-xs text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Bạn đang xem ở <strong>Chế Độ Khán Giả</strong>. Kết quả và đồng hồ bấm giờ được cập nhật trực tiếp theo thời gian thực từ trọng tài.
              </span>
            </div>
          </div>
        )}

        {/* Live Digital Clock & Start Trigger */}
        <LiveClock />

        {/* Info Lock Safeguard Banner */}
        <LockBanner />

        {/* Desktop Tab Selector */}
        <div className="hidden sm:flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'setup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            1. Điền Thông Tin & Khoá ({state.individualRunners.length + state.teams.length * 3})
          </button>

          <button
            onClick={() => setActiveTab('timing')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'timing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4" />
            2. Bấm Giờ Về Đích
            {state.isStarted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            3. Bảng Xếp Hạng & Xuất CSV
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-1">
          {activeTab === 'setup' && <SetupTab />}
          {activeTab === 'timing' && <TimerTab />}
          {activeTab === 'leaderboard' && <LeaderboardTab />}
        </div>
      </main>

      {/* Mobile-First Sticky Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'setup'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px]">Danh Sách</span>
        </button>

        <button
          onClick={() => setActiveTab('timing')}
          className={`relative flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'timing'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Timer className="w-5 h-5" />
            {state.isStarted && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px]">Bấm Giờ</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'leaderboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px]">Xếp Hạng</span>
        </button>
      </nav>

      {/* QR & Spectator Link Modal */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Đang khởi tạo hệ thống bấm giờ...</span>
        </div>
      }
    >
      <RaceProvider>
        <RaceAppContent />
      </RaceProvider>
    </React.Suspense>
  );
}
