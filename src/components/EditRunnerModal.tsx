'use client';

import React, { useState, useEffect } from 'react';
import { useRace } from '@/context/RaceContext';
import { IndividualRunner, TeamMember } from '@/types/race';
import { UserCog, X, Check, AlertCircle, Hash, User, Users } from 'lucide-react';

export type EditTarget =
  | { type: 'individual'; runner: IndividualRunner }
  | { type: 'team_member'; teamId: string; member: TeamMember; teamName: string };

interface EditRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: EditTarget | null;
}

export default function EditRunnerModal({ isOpen, onClose, target }: EditRunnerModalProps) {
  const { editIndividualRunner, editTeamMember } = useRace();
  const [name, setName] = useState('');
  const [bib, setBib] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setError('');
      if (target.type === 'individual') {
        setName(target.runner.name);
        setBib(target.runner.bib);
        setGender(target.runner.gender || 'Nam');
      } else {
        setName(target.member.name);
        setBib(target.member.bib);
      }
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (target.type === 'individual') {
      const res = editIndividualRunner(target.runner.id, {
        name,
        bib,
        gender,
      });
      if (!res.success) {
        setError(res.error || 'Có lỗi xảy ra khi cập nhật');
        return;
      }
    } else {
      const res = editTeamMember(target.teamId, target.member.id, {
        name,
        bib,
      });
      if (!res.success) {
        setError(res.error || 'Có lỗi xảy ra khi cập nhật');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 text-white space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Sửa Thông Tin Vận Động Viên</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              {target.type === 'individual' ? (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Bảng Cá Nhân
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-teal-400" /> Thành viên Đội:{' '}
                  <span className="font-semibold text-slate-200">{target.teamName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Số BIB <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bib}
                onChange={e => setBib(e.target.value.toUpperCase())}
                placeholder="VD: 101 hoặc T01"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Số BIB không được trùng với các VĐV khác trong giải.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Họ và Tên VĐV <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {target.type === 'individual' && (
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'Nam' | 'Nữ' | 'Khác')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          )}

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400">
            💡 Bạn có thể cập nhật thông tin ngay cả khi danh sách đang khoá hoặc giải đang diễn ra để kịp thời sửa sai sót số BIB hay chính tả.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" /> Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
