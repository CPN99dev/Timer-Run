'use client';

import React, { useState, useMemo } from 'react';
import { useRace } from '@/context/RaceContext';
import { formatElapsed, formatTimeOfDay } from '@/utils/time';
import {
  exportIndividualCSV,
  exportTeamCSV,
  exportAllResultsCSV,
  exportIndividualExcel,
  exportTeamExcel,
  exportAllResultsExcel
} from '@/utils/csv';
import {
  Trophy,
  Download,
  FileSpreadsheet,
  Users,
  User,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import EditRunnerModal, { EditTarget } from '@/components/EditRunnerModal';

export default function LeaderboardTab() {
  const { state, role } = useRace();
  const [boardType, setBoardType] = useState<'individual' | 'team'>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Sorted individual rankings: sorted by adjustedElapsedMs (Female x 0.85, Male x 1.0)
  const sortedIndividuals = useMemo(() => {
    const list = [...state.individualRunners];
    return list.sort((a, b) => {
      if (a.status === 'finished' && b.status === 'finished') {
        const timeA = a.adjustedElapsedMs ?? a.elapsedMs ?? 0;
        const timeB = b.adjustedElapsedMs ?? b.elapsedMs ?? 0;
        return timeA - timeB;
      }
      if (a.status === 'finished') return -1;
      if (b.status === 'finished') return 1;
      if (a.status === 'running' && b.status === 'running') return 0;
      if (a.status === 'running') return -1;
      if (b.status === 'running') return 1;
      return a.bib.localeCompare(b.bib);
    });
  }, [state.individualRunners]);

  // Filtered individuals
  const filteredIndividuals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedIndividuals;
    return sortedIndividuals.filter(
      r => r.bib.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [sortedIndividuals, searchQuery]);

  // Sorted team rankings: sorted by totalElapsedMs, tie-breaker by bestMemberElapsedMs
  const sortedTeams = useMemo(() => {
    const list = [...state.teams];
    return list.sort((a, b) => {
      // Both completed 3/3: compare totalElapsedMs, tie-breaker bestMemberElapsedMs
      if (a.finishedCount === 3 && b.finishedCount === 3) {
        const totalA = a.totalElapsedMs || 0;
        const totalB = b.totalElapsedMs || 0;
        if (totalA !== totalB) {
          return totalA - totalB;
        }
        return (a.bestMemberElapsedMs || 0) - (b.bestMemberElapsedMs || 0);
      }
      // Completed more members comes first
      if (a.finishedCount !== b.finishedCount) {
        return b.finishedCount - a.finishedCount;
      }
      return a.teamName.localeCompare(b.teamName);
    });
  }, [state.teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedTeams;
    return sortedTeams.filter(
      t =>
        t.teamName.toLowerCase().includes(q) ||
        t.members.some(m => m.bib.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    );
  }, [sortedTeams, searchQuery]);

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
  };

  const getRankBadge = (rankIndex: number, isFinished: boolean) => {
    if (!isFinished) return <span className="text-slate-500 font-mono text-sm">-</span>;
    if (rankIndex === 0) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
          🥇 1
        </span>
      );
    }
    if (rankIndex === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-sm shadow-md">
          🥈 2
        </span>
      );
    }
    if (rankIndex === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-sm shadow-md">
          🥉 3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">
        {rankIndex + 1}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Category selector + Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setBoardType('individual')}
            className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              boardType === 'individual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Bảng Cá Nhân
          </button>
          <button
            onClick={() => setBoardType('team')}
            className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              boardType === 'team'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Bảng Đồng Đội (3 người)
          </button>
        </div>

        {/* Export buttons: Excel (.xlsx) & CSV */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Excel .xlsx Export */}
          <button
            onClick={() => {
              if (boardType === 'individual') {
                exportIndividualExcel(state.individualRunners, state.raceName);
              } else {
                exportTeamExcel(state.teams, state.raceName);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold py-2 px-3.5 rounded-xl border border-emerald-500/50 shadow-md shadow-emerald-950/40 transition-all"
            title="Xuất file Excel (.xlsx) nguyên bản - Mở ra tự động tách cột chuẩn 100%"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Xuất Excel (.xlsx)
          </button>

          {/* CSV Export */}
          <button
            onClick={() => {
              if (boardType === 'individual') {
                exportIndividualCSV(state.individualRunners, state.raceName);
              } else {
                exportTeamCSV(state.teams, state.raceName);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 transition-all"
            title="Xuất file CSV (đã đính kèm chỉ thị sep=, và UTF-8 BOM cho Excel)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Xuất CSV
          </button>

          {/* Export All (Excel / CSV) */}
          <button
            onClick={() => exportAllResultsExcel(state.individualRunners, state.teams, state.raceName)}
            className="inline-flex items-center justify-center gap-1.5 bg-teal-950 hover:bg-teal-900 active:scale-95 text-teal-300 text-xs font-bold py-2 px-3 rounded-xl border border-teal-700 transition-all"
            title="Xuất tất cả kết quả 2 bảng vào 1 file Excel (gồm 2 Sheet riêng biệt)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Xuất Tất Cả (2 Sheet)
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm theo số BIB, tên VĐV hoặc tên đội..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* ================= INDIVIDUAL LEADERBOARD ================= */}
      {boardType === 'individual' && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Bảng Xếp Hạng Cá Nhân ({filteredIndividuals.length} VĐV)
              </h3>
              <p className="text-[11px] text-pink-300/80 mt-0.5">
                * Quy định điều lệ: Vận động viên Nữ được ưu tiên 15% (Thời gian xếp hạng = Thực tế × 0.85)
              </p>
            </div>
            <button
              onClick={triggerConfetti}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium shrink-0 self-start sm:self-auto"
            >
              <Sparkles className="w-3 h-3" /> Chúc mừng VĐV
            </button>
          </div>

          {filteredIndividuals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Chưa có dữ liệu bảng xếp hạng cá nhân.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIndividuals.map((runner, index) => {
                const isFinished = runner.status === 'finished';
                const isFemale = runner.gender === 'Nữ';
                return (
                  <div
                    key={runner.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      index === 0 && isFinished
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : index === 1 && isFinished
                        ? 'bg-slate-800/40 border-slate-600/40'
                        : index === 2 && isFinished
                        ? 'bg-amber-950/10 border-amber-700/30'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    {/* Rank & Runner Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{getRankBadge(index, isFinished)}</div>

                      <div className="font-mono text-sm font-black px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
                        #{runner.bib}
                      </div>

                      <div className="truncate">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                          {runner.name}
                          {role === 'referee' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTarget({ type: 'individual', runner });
                              }}
                              className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition-colors"
                              title="Sửa thông tin VĐV"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {index === 0 && isFinished && (
                            <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.2 bg-amber-950/80 rounded border border-amber-800/60">
                              Vô địch
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className={isFemale ? 'text-pink-300 font-semibold' : 'text-slate-300'}>
                            {runner.gender || 'Nam'}
                          </span>
                          {runner.finishTime && (
                            <>
                              <span>•</span>
                              <span>Về đích lúc: {formatTimeOfDay(runner.finishTime)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Finish Time & Status */}
                    <div className="text-right shrink-0">
                      {isFinished ? (
                        <>
                          <div className="font-mono text-base font-black text-emerald-400">
                            {formatElapsed(runner.adjustedElapsedMs ?? runner.elapsedMs, true)}
                          </div>
                          {isFemale ? (
                            <div className="text-[10px] text-pink-300 font-medium">
                              -15% (Gốc: {formatElapsed(runner.elapsedMs)})
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                            </span>
                          )}
                        </>
                      ) : runner.status === 'running' ? (
                        <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> Đang chạy...
                        </div>
                      ) : runner.status === 'dnf' ? (
                        <span className="text-xs text-rose-400 font-semibold">DNF (Bỏ cuộc)</span>
                      ) : (
                        <span className="text-xs text-slate-500">Chưa chạy</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TEAM LEADERBOARD ================= */}
      {boardType === 'team' && (
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Bảng Xếp Hạng Đồng Đội ({filteredTeams.length} Đội)
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium">
              1 đội 3 người • Xếp hạng theo TỔNG thời gian 3 thành viên
            </span>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Chưa có dữ liệu bảng xếp hạng đồng đội.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team, index) => {
                const isAllFinished = team.finishedCount === 3;
                const isExpanded = expandedTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      index === 0 && isAllFinished
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : index === 1 && isAllFinished
                        ? 'bg-slate-800/40 border-slate-600/40'
                        : index === 2 && isAllFinished
                        ? 'bg-amber-950/10 border-amber-700/30'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleTeamExpand(team.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">{getRankBadge(index, isAllFinished)}</div>

                        <div className="truncate">
                          <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                            {team.teamName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className={
                              isAllFinished ? 'text-emerald-400 font-semibold' : 'text-amber-400'
                            }>
                              Đã về đích: {team.finishedCount}/3 thành viên
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Tổng thời gian 3 VĐV</span>
                          {isAllFinished ? (
                            <>
                              <div className="font-mono text-base font-black text-emerald-400">
                                {formatElapsed(team.totalElapsedMs, true)}
                              </div>
                              {team.bestMemberElapsedMs && (
                                <span className="text-[10px] text-slate-400 block">
                                  Nhanh nhất: {formatElapsed(team.bestMemberElapsedMs)}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-amber-400 font-medium">
                              Đang chờ {3 - team.finishedCount} VĐV...
                            </div>
                          )}
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Member Details Breakdown */}
                    <div className="bg-slate-900/90 border-t border-slate-800/80 px-3.5 py-2.5 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Chi tiết thời gian 3 thành viên:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {team.members.map((m) => (
                          <div
                            key={m.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex items-center justify-between text-xs gap-1.5"
                          >
                            <div className="truncate pr-1 flex items-center gap-1">
                              <span className="font-mono font-bold text-emerald-400 mr-1 shrink-0">
                                #{m.bib}
                              </span>
                              <span className="text-slate-200 truncate">{m.name}</span>
                              {role === 'referee' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTarget({ type: 'team_member', teamId: team.id, member: m, teamName: team.teamName });
                                  }}
                                  className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition-colors shrink-0"
                                  title={`Sửa thông tin #${m.bib}`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="font-mono font-semibold text-right shrink-0">
                              {m.status === 'finished' ? (
                                <span className="text-emerald-400">{formatElapsed(m.elapsedMs)}</span>
                              ) : m.status === 'running' ? (
                                <span className="text-amber-400 text-[10px]">Đang chạy</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Chưa xong</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Runner Modal */}
      <EditRunnerModal
        isOpen={Boolean(editingTarget)}
        onClose={() => setEditingTarget(null)}
        target={editingTarget}
      />
    </div>
  );
}
