'use client';

import React, { useState, useMemo } from 'react';
import { useRace } from '@/context/RaceContext';
import { formatElapsed } from '@/utils/time';
import {
  CheckCircle,
  RotateCcw,
  Search,
  Flag,
  Users,
  User,
  AlertCircle,
  Flame,
  Delete,
  Hash
} from 'lucide-react';

export default function TimerTab() {
  const {
    state,
    recordFinishByBib,
    recordFinishById,
    undoLastFinish,
    markDNF,
    role
  } = useRace();

  const [bibInput, setBibInput] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'team'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Numpad handler
  const handleNumpadPress = (num: string) => {
    setBibInput(prev => prev + num);
  };

  const handleNumpadBackspace = () => {
    setBibInput(prev => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    setBibInput('');
  };

  const handleSubmitBib = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bibInput.trim()) return;

    const res = recordFinishByBib(bibInput);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setBibInput('');
    } else {
      setMessage({ text: res.message, type: 'error' });
    }

    setTimeout(() => {
      setMessage(null);
    }, 4500);
  };

  // Matched runner preview when typing BIB
  const previewRunner = useMemo(() => {
    const q = bibInput.trim().toUpperCase();
    if (!q) return null;

    const ind = state.individualRunners.find(r => r.bib.toUpperCase() === q);
    if (ind) {
      return { type: 'individual' as const, name: ind.name, bib: ind.bib, status: ind.status, sub: 'Bảng Cá nhân' };
    }

    for (const t of state.teams) {
      const m = t.members.find(mem => mem.bib.toUpperCase() === q);
      if (m) {
        return { type: 'team' as const, name: m.name, bib: m.bib, status: m.status, sub: `Đội: ${t.teamName}` };
      }
    }
    return null;
  }, [bibInput, state.individualRunners, state.teams]);

  // Active individual runners
  const activeIndRunners = useMemo(() => {
    return state.individualRunners.filter(r => r.status === 'running');
  }, [state.individualRunners]);

  // Active team members
  const activeTeamMembers = useMemo(() => {
    const list: { member: typeof state.teams[0]['members'][0]; team: typeof state.teams[0] }[] = [];
    state.teams.forEach(t => {
      t.members.forEach(m => {
        if (m.status === 'running') {
          list.push({ member: m, team: t });
        }
      });
    });
    return list;
  }, [state.teams]);

  // Filtered active list for quick tap
  const filteredActiveRunners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: Array<
      | { type: 'ind'; data: typeof state.individualRunners[0] }
      | { type: 'team'; member: typeof state.teams[0]['members'][0]; team: typeof state.teams[0] }
    > = [];

    if (filterType === 'all' || filterType === 'individual') {
      activeIndRunners.forEach(r => {
        if (!q || r.bib.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) {
          result.push({ type: 'ind', data: r });
        }
      });
    }

    if (filterType === 'all' || filterType === 'team') {
      activeTeamMembers.forEach(item => {
        if (
          !q ||
          item.member.bib.toLowerCase().includes(q) ||
          item.member.name.toLowerCase().includes(q) ||
          item.team.teamName.toLowerCase().includes(q)
        ) {
          result.push({ type: 'team', member: item.member, team: item.team });
        }
      });
    }

    return result;
  }, [activeIndRunners, activeTeamMembers, filterType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Undo Banner if an action was just recorded */}
      {state.lastFinishedAction && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-3.5 rounded-2xl border border-emerald-500/40 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 truncate">
            <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
            <div className="truncate">
              <span className="text-xs text-emerald-200 block font-medium">Vừa ghi nhận về đích:</span>
              <span className="text-sm font-bold truncate">
                #{state.lastFinishedAction.bib} - {state.lastFinishedAction.runnerName}
              </span>
            </div>
          </div>

          {role === 'referee' && (
            <button
              onClick={undoLastFinish}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0 shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Hoàn tác
            </button>
          )}
        </div>
      )}

      {/* Warning message if race not started */}
      {!state.isStarted && (
        <div className="bg-amber-950/40 border border-amber-800/60 text-amber-200 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm text-amber-300">Giải chạy chưa xuất phát!</p>
            Vui lòng nhấn nút <span className="font-bold underline">"BẮT ĐẦU GIẢI CHẠY (MASS START)"</span> ở trên đồng hồ để khởi động tính giờ trước khi bấm về đích.
          </div>
        </div>
      )}

      {/* QUICK BIB NUMPAD & INPUT CONSOLE */}
      {role === 'referee' && state.isStarted && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-400" />
              Bấm Số BIB Về Đích Nhanh
            </h3>
            <span className="text-[11px] text-slate-500">Bấm số hoặc gõ phím</span>
          </div>

          {/* Input display & Action button */}
          <form onSubmit={handleSubmitBib} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="text"
                  placeholder="Nhập số BIB..."
                  value={bibInput}
                  onChange={e => setBibInput(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-white tracking-widest placeholder-slate-600 text-center"
                />
                {bibInput && (
                  <button
                    type="button"
                    onClick={handleNumpadClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!bibInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 text-base shrink-0"
              >
                <Flag className="w-5 h-5 fill-current" />
                VỀ ĐÍCH
              </button>
            </div>

            {/* Preview matched runner */}
            {previewRunner && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                previewRunner.status === 'finished'
                  ? 'bg-amber-950/50 border-amber-800 text-amber-200'
                  : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              }`}>
                <div>
                  <span className="font-bold text-sm">#{previewRunner.bib}</span> - {previewRunner.name}
                  <span className="text-[11px] opacity-80 block">{previewRunner.sub}</span>
                </div>
                <span className="font-semibold text-xs px-2 py-0.5 rounded bg-black/30">
                  {previewRunner.status === 'finished' ? 'Đã về đích' : 'Đang chạy'}
                </span>
              </div>
            )}

            {/* Notification message */}
            {message && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                message.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-700 text-rose-300'
              }`}>
                {message.text}
              </div>
            )}
          </form>

          {/* On-screen Touch Numpad for mobile referee */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadPress(num)}
                className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono text-xl font-bold py-2.5 rounded-xl border border-slate-700 transition-all select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNumpadClear}
              className="bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold py-2.5 rounded-xl border border-slate-700/60"
            >
              Xoá
            </button>
            <button
              type="button"
              onClick={() => handleNumpadPress('0')}
              className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono text-xl font-bold py-2.5 rounded-xl border border-slate-700"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleNumpadBackspace}
              className="bg-slate-800/60 hover:bg-slate-800 text-slate-400 flex items-center justify-center py-2.5 rounded-xl border border-slate-700/60"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* LIST OF RUNNERS CURRENTLY ON THE COURSE */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Đang Chạy Trên Đường Đua ({activeIndRunners.length + activeTeamMembers.length})
            </h3>
            <p className="text-xs text-slate-400">
              Chạm trực tiếp nút <span className="text-emerald-400 font-bold">VỀ ĐÍCH</span> của VĐV khi họ cán đích
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'individual' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Cá nhân ({activeIndRunners.length})
            </button>
            <button
              onClick={() => setFilterType('team')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'team' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Đồng đội ({activeTeamMembers.length})
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số BIB hoặc tên VĐV..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Runner Cards Grid */}
        {filteredActiveRunners.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            {state.isStarted
              ? 'Tất cả vận động viên đã hoàn thành cuộc đua! Xem bảng xếp hạng ở tab bên cạnh.'
              : 'Chưa có vận động viên nào đang chạy.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredActiveRunners.map(item => {
              if (item.type === 'ind') {
                const r = item.data;
                return (
                  <div
                    key={r.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono text-base font-black px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
                        #{r.bib}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white truncate">{r.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" /> Cá nhân
                          </span>
                          <span>•</span>
                          <span>{r.gender || 'Nam'}</span>
                        </div>
                      </div>
                    </div>

                    {role === 'referee' && state.isStarted && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => recordFinishById(r.id, 'individual')}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <Flag className="w-4 h-4 fill-current" />
                          VỀ ĐÍCH
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Đánh dấu BIB #${r.bib} (${r.name}) không hoàn thành (DNF)?`)) {
                              markDNF(r.bib);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-2 rounded-lg text-xs"
                          title="Không hoàn thành (DNF)"
                        >
                          DNF
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else {
                const { member, team } = item;
                return (
                  <div
                    key={member.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono text-base font-black px-2.5 py-1.5 rounded-lg bg-teal-950/60 border border-teal-800 text-teal-300 shrink-0">
                        #{member.bib}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white truncate">{member.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="flex items-center gap-1 text-teal-400 font-medium">
                            <Users className="w-3 h-3" /> {team.teamName}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            (Đội đã về {team.finishedCount}/3)
                          </span>
                        </div>
                      </div>
                    </div>

                    {role === 'referee' && state.isStarted && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => recordFinishById(member.id, 'team_member', team.id)}
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <Flag className="w-4 h-4 fill-current" />
                          VỀ ĐÍCH
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Đánh dấu BIB #${member.bib} (${member.name}) không hoàn thành (DNF)?`)) {
                              markDNF(member.bib);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-2 rounded-lg text-xs"
                          title="Không hoàn thành (DNF)"
                        >
                          DNF
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
