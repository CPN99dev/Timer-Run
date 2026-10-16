'use client';

import React, { useState } from 'react';
import { useRace } from '@/context/RaceContext';
import { UserPlus, Users, Trash2, Edit3, Database, ShieldAlert, Check, X, Sparkles } from 'lucide-react';
import EditRunnerModal, { EditTarget } from '@/components/EditRunnerModal';

export default function SetupTab() {
  const {
    state,
    addIndividualRunner,
    removeIndividualRunner,
    addTeam,
    removeTeam,
    loadSampleData,
    clearAllData,
    role
  } = useRace();

  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'team'>('individual');
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);
  
  // Individual Form
  const [indBib, setIndBib] = useState('');
  const [indName, setIndName] = useState('');
  const [indGender, setIndGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [indError, setIndError] = useState('');

  // Team Form (3 members)
  const [teamName, setTeamName] = useState('');
  const [m1Bib, setM1Bib] = useState('');
  const [m1Name, setM1Name] = useState('');
  const [m2Bib, setM2Bib] = useState('');
  const [m2Name, setM2Name] = useState('');
  const [m3Bib, setM3Bib] = useState('');
  const [m3Name, setM3Name] = useState('');
  const [teamError, setTeamError] = useState('');

  const handleAddIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    setIndError('');
    const res = addIndividualRunner(indBib, indName, indGender);
    if (!res.success) {
      setIndError(res.error || 'Có lỗi xảy ra');
    } else {
      setIndBib('');
      setIndName('');
    }
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError('');
    const res = addTeam(teamName, [
      { bib: m1Bib, name: m1Name },
      { bib: m2Bib, name: m2Name },
      { bib: m3Bib, name: m3Name },
    ]);
    if (!res.success) {
      setTeamError(res.error || 'Có lỗi xảy ra');
    } else {
      setTeamName('');
      setM1Bib('');
      setM1Name('');
      setM2Bib('');
      setM2Name('');
      setM3Bib('');
      setM3Name('');
    }
  };

  const isLocked = state.isLocked;

  return (
    <div className="space-y-4">
      {/* Category selection tabs */}
      <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => setActiveSubTab('individual')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'individual'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Bảng Cá Nhân ({state.individualRunners.length})
        </button>
        <button
          onClick={() => setActiveSubTab('team')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'team'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Bảng Đồng Đội 3 Người ({state.teams.length})
        </button>
      </div>

      {/* Quick sample / clear toolbar */}
      {role === 'referee' && !isLocked && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Công cụ chuẩn bị:</span>
          <div className="flex gap-2">
            <button
              onClick={loadSampleData}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 active:scale-95 transition-all"
              title="Điền sẵn danh sách mẫu để chạy thử ngay"
            >
              <Sparkles className="w-3.5 h-3.5" /> Nạp Dữ Liệu Mẫu
            </button>
            <button
              onClick={clearAllData}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá Hết
            </button>
          </div>
        </div>
      )}

      {/* ================= INDIVIDUAL TAB ================= */}
      {activeSubTab === 'individual' && (
        <div className="space-y-4">
          {/* Add form */}
          {role === 'referee' && (
            <div className={`bg-slate-900 rounded-2xl p-4 border transition-all ${
              isLocked ? 'border-slate-800 opacity-60 pointer-events-none' : 'border-slate-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Thêm Vận Động Viên Cá Nhân
                </h3>
                {isLocked && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    (Đang khoá thông tin)
                  </span>
                )}
              </div>

              {indError && (
                <div className="mb-3 text-xs bg-rose-950/70 border border-rose-800 text-rose-300 p-2 rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {indError}
                </div>
              )}

              <form onSubmit={handleAddIndividual} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Số BIB <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 101"
                      value={indBib}
                      onChange={e => setIndBib(e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Họ và Tên VĐV <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn Nam"
                      value={indName}
                      onChange={e => setIndName(e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Giới tính
                    </label>
                    <select
                      value={indGender}
                      onChange={e => setIndGender(e.target.value as 'Nam' | 'Nữ' | 'Khác')}
                      disabled={isLocked}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLocked || !indBib || !indName}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Thêm Vào Danh Sách
                </button>
              </form>
            </div>
          )}

          {/* List of runners */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Danh Sách VĐV Cá Nhân ({state.individualRunners.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Sắp xếp theo thứ tự thêm</span>
            </h4>

            {state.individualRunners.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có vận động viên nào trong bảng cá nhân.
                {role === 'referee' && !isLocked && (
                  <p className="mt-1 text-xs text-emerald-400 cursor-pointer" onClick={loadSampleData}>
                    👉 Bấm vào đây để nạp dữ liệu mẫu
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {state.individualRunners.map((runner) => (
                  <div key={runner.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono font-bold text-sm bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                        #{runner.bib}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white flex flex-wrap items-center gap-2">
                          <span className="break-words">{runner.name}</span>
                          {runner.company && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                              {runner.company}
                            </span>
                          )}
                        </div>
                        {runner.slogan && (
                          <div className="text-[11px] text-amber-300/80 italic break-words mt-0.5">
                            "{runner.slogan}"
                          </div>
                        )}
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>{runner.gender || 'Nam'}</span>
                          <span>•</span>
                          <span className={
                            runner.status === 'finished' ? 'text-emerald-400 font-medium' :
                            runner.status === 'running' ? 'text-amber-400' : 'text-slate-500'
                          }>
                            {runner.status === 'finished' ? 'Đã về đích' :
                             runner.status === 'running' ? 'Đang chạy' : 'Chưa chạy'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {role === 'referee' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTarget({ type: 'individual', runner })}
                          className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Sửa thông tin VĐV (Tên, BIB, Giới tính)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!isLocked && (
                          <button
                            onClick={() => removeIndividualRunner(runner.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Xoá VĐV"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TEAM TAB ================= */}
      {activeSubTab === 'team' && (
        <div className="space-y-4">
          {/* Add team form */}
          {role === 'referee' && (
            <div className={`bg-slate-900 rounded-2xl p-4 border transition-all ${
              isLocked ? 'border-slate-800 opacity-60 pointer-events-none' : 'border-slate-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Đăng Ký Đội 3 Người
                </h3>
                {isLocked && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    (Đang khoá thông tin)
                  </span>
                )}
              </div>

              {teamError && (
                <div className="mb-3 text-xs bg-rose-950/70 border border-rose-800 text-rose-300 p-2 rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {teamError}
                </div>
              )}

              <form onSubmit={handleAddTeam} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Tên Đội Thi Đấu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tia Chớp Runners"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    disabled={isLocked}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-semibold text-emerald-400">
                    3 Thành Viên Trong Đội:
                  </p>

                  {/* Member 1 */}
                  <div className="grid grid-cols-12 gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="BIB 1 (VD: T01)"
                        value={m1Bib}
                        onChange={e => setM1Bib(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-8">
                      <input
                        type="text"
                        placeholder="Họ tên thành viên 1"
                        value={m1Name}
                        onChange={e => setM1Name(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Member 2 */}
                  <div className="grid grid-cols-12 gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="BIB 2 (VD: T02)"
                        value={m2Bib}
                        onChange={e => setM2Bib(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-8">
                      <input
                        type="text"
                        placeholder="Họ tên thành viên 2"
                        value={m2Name}
                        onChange={e => setM2Name(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Member 3 */}
                  <div className="grid grid-cols-12 gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="BIB 3 (VD: T03)"
                        value={m3Bib}
                        onChange={e => setM3Bib(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-8">
                      <input
                        type="text"
                        placeholder="Họ tên thành viên 3"
                        value={m3Name}
                        onChange={e => setM3Name(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLocked || !teamName || !m1Bib || !m2Bib || !m3Bib}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Thêm Đội 3 Người
                </button>
              </form>
            </div>
          )}

          {/* List of teams */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Danh Sách Đội ({state.teams.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">1 đội gồm 3 VĐV</span>
            </h4>

            {state.teams.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có đội nào đăng ký.
                {role === 'referee' && !isLocked && (
                  <p className="mt-1 text-xs text-emerald-400 cursor-pointer" onClick={loadSampleData}>
                    👉 Bấm vào đây để nạp dữ liệu mẫu
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {state.teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-white break-words">{team.teamName}</span>
                        {team.company && team.company !== team.teamName && (
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            {team.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {team.finishedCount}/3 hoàn thành
                        </span>
                        {role === 'referee' && !isLocked && (
                          <button
                            onClick={() => removeTeam(team.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {team.slogan && (
                      <div className="text-[11px] text-teal-300/80 italic -mt-1 break-words">
                        "{team.slogan}"
                      </div>
                    )}

                    {/* 3 members */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-800/80">
                      {team.members.map((member, idx) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-slate-900/90 px-3 py-2.5 rounded-xl border border-slate-800 text-xs gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-emerald-400 shrink-0">#{member.bib}</span>
                              <span className="text-slate-100 font-bold text-xs sm:text-sm break-words leading-tight">{member.name}</span>
                            </div>
                            {member.roleInTeam && (
                              <div className="mt-1">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-block ${
                                  member.roleInTeam === 'Leader'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {member.roleInTeam}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-center">
                            <span className={
                              member.status === 'finished' ? 'text-emerald-400 text-[10px] font-semibold px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800/60' :
                              member.status === 'running' ? 'text-amber-400 text-[10px] font-medium px-2 py-0.5 bg-amber-950/60 rounded border border-amber-800/60' : 'text-slate-500 text-[10px] px-2 py-0.5 bg-slate-800/60 rounded'
                            }>
                              {member.status === 'finished' ? 'Xong' :
                               member.status === 'running' ? 'Chạy' : 'Chờ'}
                            </span>
                            {role === 'referee' && (
                              <button
                                onClick={() => setEditingTarget({ type: 'team_member', teamId: team.id, member, teamName: team.teamName })}
                                className="text-slate-400 hover:text-emerald-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                                title={`Sửa thông tin VĐV #${member.bib}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
