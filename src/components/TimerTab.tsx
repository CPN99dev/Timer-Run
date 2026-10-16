'use client';

import React, { useState, useMemo } from 'react';
import { useRace } from '@/context/RaceContext';
import {
  CheckCircle,
  RotateCcw,
  Search,
  Flag,
  Users,
  User,
  AlertCircle,
  Flame,
  Sparkles
} from 'lucide-react';

export default function TimerTab() {
  const {
    state,
    recordFinishById,
    undoLastFinish,
    markDNF,
    role
  } = useRace();

  const [filterType, setFilterType] = useState<'all' | 'individual' | 'team'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        if (
          !q ||
          r.bib.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          (r.company && r.company.toLowerCase().includes(q)) ||
          (r.slogan && r.slogan.toLowerCase().includes(q))
        ) {
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
          item.team.teamName.toLowerCase().includes(q) ||
          (item.team.company && item.team.company.toLowerCase().includes(q)) ||
          (item.team.slogan && item.team.slogan.toLowerCase().includes(q)) ||
          (item.member.roleInTeam && item.member.roleInTeam.toLowerCase().includes(q))
        ) {
          result.push({ type: 'team', member: item.member, team: item.team });
        }
      });
    }

    return result;
  }, [activeIndRunners, activeTeamMembers, filterType, searchQuery]);

  const totalActive = activeIndRunners.length + activeTeamMembers.length;

  return (
    <div className="space-y-4">
      {/* Undo Banner if an action was just recorded */}
      {state.lastFinishedAction && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-3.5 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs text-emerald-300 block font-medium">Vừa ghi nhận về đích:</span>
              <span className="text-sm font-bold block break-words">
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
            Vui lòng nhấn nút <span className="font-bold underline text-amber-100">"XUẤT PHÁT CHUNG"</span> hoặc xuất phát riêng từng bảng ở khung đồng hồ phía trên để bắt đầu tính giờ.
          </div>
        </div>
      )}

      {/* LIST OF RUNNERS CURRENTLY ON THE COURSE */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Đang Chạy Trên Đường Đua ({totalActive})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {role === 'referee' ? (
                <>Chạm nút <span className="text-emerald-400 font-bold">VỀ ĐÍCH</span> của VĐV khi họ cán đích</>
              ) : (
                'Danh sách vận động viên đang trên đường chạy'
              )}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({totalActive})
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'individual' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cá nhân ({activeIndRunners.length})
            </button>
            <button
              onClick={() => setFilterType('team')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'team' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đồng đội ({activeTeamMembers.length})
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhanh theo số BIB hoặc tên VĐV..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Runner Cards Grid */}
        {filteredActiveRunners.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            {state.isStarted ? (
              <div>
                <p className="font-semibold text-slate-400">Tất cả vận động viên đã hoàn thành cuộc đua! 🎉</p>
                <p className="text-xs text-slate-500 mt-1">Chuyển sang tab Bảng Xếp Hạng để xem kết quả chi tiết.</p>
              </div>
            ) : (
              'Chưa có vận động viên nào đang chạy trên đường đua.'
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredActiveRunners.map(item => {
              if (item.type === 'ind') {
                const r = item.data;
                const isFemale = r.gender === 'Nữ';
                return (
                  <div
                    key={r.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="font-mono text-base font-black px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-400 shrink-0">
                        #{r.bib}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                          <span className="break-words">{r.name}</span>
                          {r.company && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                              {r.company}
                            </span>
                          )}
                        </div>
                        {r.slogan && (
                          <div className="text-[11px] text-amber-300/80 italic mt-0.5 break-words">
                            "{r.slogan}"
                          </div>
                        )}
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500 shrink-0" /> Cá nhân
                          </span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{r.gender || 'Nam'}</span>
                          {isFemale && (
                            <span className="text-[10px] bg-pink-950 text-pink-300 px-1.5 py-0.2 rounded border border-pink-800/60 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> -15%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {role === 'referee' && state.isStarted ? (
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
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 shrink-0">
                        Đang chạy
                      </span>
                    )}
                  </div>
                );
              } else {
                const { member, team } = item;
                return (
                  <div
                    key={member.id}
                    className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="font-mono text-base font-black px-2.5 py-1.5 rounded-lg bg-teal-950/70 border border-teal-800 text-teal-300 shrink-0">
                        #{member.bib}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                          <span className="break-words">{member.name}</span>
                          {member.roleInTeam && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                              member.roleInTeam === 'Leader'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {member.roleInTeam}
                            </span>
                          )}
                        </div>
                        {team.slogan && (
                          <div className="text-[11px] text-teal-300/80 italic mt-0.5 break-words">
                            "{team.slogan}"
                          </div>
                        )}
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-teal-400 font-medium">
                            <Users className="w-3 h-3 shrink-0" /> {team.teamName}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 shrink-0">
                            (Đã về {team.finishedCount}/3)
                          </span>
                        </div>
                      </div>
                    </div>

                    {role === 'referee' && state.isStarted ? (
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
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-950/60 text-teal-300 border border-teal-800/60 shrink-0">
                        Đang chạy
                      </span>
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
