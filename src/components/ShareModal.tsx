'use client';

import React, { useState, useEffect } from 'react';
import { useRace } from '@/context/RaceContext';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check, X, Eye, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { roomCode, setRoomCode, lastSyncTime } = useRace();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [customRoom, setCustomRoom] = useState(roomCode);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setShareUrl(`${origin}/?room=${encodeURIComponent(roomCode)}`);
    }
  }, [roomCode]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoom.trim()) {
      setRoomCode(customRoom.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 text-white space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Chia Sẻ Xem Trực Tiếp</h3>
            <p className="text-xs text-slate-400">Khán giả vào xem ngay lập tức, không bắt đăng nhập</p>
          </div>
        </div>

        {/* Room Code form */}
        <form onSubmit={handleApplyRoom} className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Mã Phòng Thi Đấu (Room Code):</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customRoom}
              onChange={e => setCustomRoom(e.target.value.toUpperCase())}
              placeholder="VD: RUN2026"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500 uppercase"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
            >
              Đổi Mã
            </button>
          </div>
        </form>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow-inner">
          {shareUrl ? (
            <QRCodeSVG
              value={shareUrl}
              size={180}
              level="M"
              includeMargin={false}
              className="rounded"
            />
          ) : (
            <div className="w-44 h-44 bg-slate-200 animate-pulse rounded" />
          )}
          <span className="text-[11px] text-slate-800 font-bold mt-2.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quét mã để xem trực tiếp (Không cần đăng nhập)
          </span>
        </div>

        {/* SINGLE SHARE LINK */}
        <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Link Xem Trực Tiếp:
            </label>
            <span className="text-[10px] text-slate-400">Mở trên điện thoại / máy tính</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono rounded-lg px-2.5 py-2 w-full focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Đã chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Sao chép
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Khán giả mở link hoặc quét mã QR sẽ vào xem được ngay đồng hồ và bảng xếp hạng theo thời gian thực.
          </p>
        </div>

        {/* Sync Status */}
        <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Đồng bộ Cloud Sync
          </span>
          <span>{lastSyncTime ? `Lúc ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Sẵn sàng'}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
