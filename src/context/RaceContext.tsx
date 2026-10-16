'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { RaceState, IndividualRunner, Team, TeamMember, UserRole, RunnerStatus } from '@/types/race';
import { sound, triggerHaptic } from '@/utils/audio';

const STORAGE_KEY = 'race_timer_state_v3';
const REFEREE_AUTH_KEY = 'race_referee_auth_v1';

const initialRaceState: RaceState = {
  raceName: 'Giải Chạy Tiếp Sức & Vô Địch 2026',
  isLocked: false,
  isStarted: false,
  isPaused: false,
  startTime: null,
  endTime: null,
  
  individualStartTime: null,
  individualEndTime: null,
  individualStarted: false,

  teamStartTime: null,
  teamEndTime: null,
  teamStarted: false,

  pauseTime: null,
  totalPausedMs: 0,
  individualRunners: [],
  teams: [],
  lastFinishedAction: null,
  roomCode: 'RUN2026',
  refereePin: '8888',
  updatedAt: 0,
};

interface RaceContextType {
  state: RaceState;
  role: UserRole;
  setRole: (role: UserRole) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  connectedViewers: number;
  isOnlineSyncActive: boolean;
  lastSyncTime: number | null;
  
  // Setup & Lock
  setRaceName: (name: string) => void;
  lockInformation: () => void;
  unlockInformation: () => void;
  addIndividualRunner: (bib: string, name: string, gender?: 'Nam' | 'Nữ' | 'Khác') => { success: boolean; error?: string };
  removeIndividualRunner: (id: string) => void;
  editIndividualRunner: (id: string, updates: { bib: string; name: string; gender?: 'Nam' | 'Nữ' | 'Khác' }) => { success: boolean; error?: string };
  addTeam: (teamName: string, members: { bib: string; name: string }[]) => { success: boolean; error?: string };
  removeTeam: (id: string) => void;
  editTeam: (id: string, teamName: string, members: { bib: string; name: string }[]) => { success: boolean; error?: string };
  editTeamMember: (teamId: string, memberId: string, updates: { bib: string; name: string }) => { success: boolean; error?: string };
  loadSampleData: () => void;
  clearAllData: () => void;
  
  // Timing Starts
  startRace: () => void; // Xuất phát chung (cả 2 bảng)
  startIndividualRace: () => void; // Xuất phát riêng Bảng Cá nhân
  startTeamRace: () => void; // Xuất phát riêng Bảng Đồng đội
  
  // Timing Finishes
  recordFinishByBib: (bib: string) => { success: boolean; message: string };
  recordFinishById: (id: string, type: 'individual' | 'team_member', teamId?: string) => boolean;
  markDNF: (bib: string) => void;
  undoLastFinish: () => boolean;
  resetRaceTimer: () => void;

  // Permissions
  verifyRefereePin: (pin: string) => boolean;
  changeRefereePin: (newPin: string) => boolean;
}

const RaceContext = createContext<RaceContextType | undefined>(undefined);

export function RaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RaceState>(initialRaceState);
  const [role, setRoleState] = useState<UserRole>('referee');
  const [connectedViewers, setConnectedViewers] = useState<number>(0);
  const [isOnlineSyncActive, setIsOnlineSyncActive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastBroadcastStateRef = useRef<string>('');

  // 1. Initialize from URL params and localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const urlRole = params.get('role');

    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedState = initialRaceState;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (urlRoom) parsed.roomCode = urlRoom.toUpperCase();
        loadedState = parsed;
        setState(parsed);
      } catch (e) {
        console.error('Failed to load saved race state', e);
      }
    } else if (urlRoom) {
      loadedState = { ...initialRaceState, roomCode: urlRoom.toUpperCase() };
      setState(loadedState);
    }

    // Role handling (Single unified link for everyone!):
    // If previously authorized as referee on this device -> referee
    // If direct root visit without room (creator setting up) -> referee
    // If opening any shared room link -> viewer (enter PIN via Header to become referee)
    const hasRefereeAuth = localStorage.getItem(REFEREE_AUTH_KEY) === 'true';
    if (hasRefereeAuth) {
      setRoleState('referee');
    } else if (!urlRoom) {
      setRoleState('referee');
      localStorage.setItem(REFEREE_AUTH_KEY, 'true');
    } else {
      setRoleState('viewer');
    }

    // Initialize BroadcastChannel for cross-tab sync
    try {
      const bc = new BroadcastChannel('race_timer_bc');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE') {
          const incoming = event.data.state as RaceState;
          if (incoming && incoming.updatedAt > (state.updatedAt || 0)) {
            setState(incoming);
          }
        }
      };
      broadcastChannelRef.current = bc;
    } catch {
      // BroadcastChannel fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  // 2. Persist to localStorage whenever state changes (if referee)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (role === 'referee') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, role]);

  // 3. Broadcast to other tabs & sync with Server API
  const pushStateToServer = useCallback(async (stateToPush: RaceState) => {
    try {
      setIsOnlineSyncActive(true);
      await fetch('/api/race/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: stateToPush.roomCode,
          state: stateToPush,
        }),
      });
      setLastSyncTime(Date.now());
    } catch (err) {
      console.warn('API sync warn:', err);
    } finally {
      setIsOnlineSyncActive(false);
    }
  }, []);

  // Broadcast state updates
  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized !== lastBroadcastStateRef.current) {
      lastBroadcastStateRef.current = serialized;
      
      broadcastChannelRef.current?.postMessage({
        type: 'SYNC_STATE',
        state,
      });

      if (role === 'referee') {
        pushStateToServer(state);
      }
    }
  }, [state, role, pushStateToServer]);

  // 4. Viewer Polling Sync (if in viewer role)
  useEffect(() => {
    if (role !== 'viewer') return;

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/race/sync?room=${encodeURIComponent(state.roomCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.found && data.state) {
            setState(data.state);
            setLastSyncTime(Date.now());
          }
        }
      } catch {
        // silent catch on network hiccups
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 1500); // 1.5s live polling
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [role, state.roomCode]);

  // --- PERMISSION ACTIONS ---

  const verifyRefereePin = (pin: string): boolean => {
    const correctPin = state.refereePin || '8888';
    if (pin.trim() === correctPin) {
      setRoleState('referee');
      if (typeof window !== 'undefined') {
        localStorage.setItem(REFEREE_AUTH_KEY, 'true');
        const url = new URL(window.location.href);
        url.searchParams.delete('role');
        url.searchParams.delete('pin');
        window.history.replaceState({}, '', url.toString());
      }
      return true;
    }
    return false;
  };

  const changeRefereePin = (newPin: string): boolean => {
    const clean = newPin.trim();
    if (!clean || clean.length < 4) return false;
    setState(prev => ({ ...prev, refereePin: clean, updatedAt: Date.now() }));
    return true;
  };

  const setRole = (newRole: UserRole) => {
    if (newRole === 'viewer') {
      setRoleState('viewer');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(REFEREE_AUTH_KEY);
        const url = new URL(window.location.href);
        url.searchParams.delete('role');
        url.searchParams.delete('pin');
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      setRoleState('referee');
      if (typeof window !== 'undefined') {
        localStorage.setItem(REFEREE_AUTH_KEY, 'true');
        const url = new URL(window.location.href);
        url.searchParams.delete('role');
        url.searchParams.delete('pin');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const setRoomCode = (code: string) => {
    const formatted = code.trim().toUpperCase() || 'RUN2026';
    setState(prev => ({ ...prev, roomCode: formatted, updatedAt: Date.now() }));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', formatted);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const setRaceName = (name: string) => {
    if (state.isLocked) return;
    setState(prev => ({ ...prev, raceName: name, updatedAt: Date.now() }));
  };

  const lockInformation = () => {
    triggerHaptic(50);
    setState(prev => ({ ...prev, isLocked: true, updatedAt: Date.now() }));
  };

  const unlockInformation = () => {
    if (state.isStarted && !confirm('Giải chạy đang diễn ra. Bạn có chắc chắn muốn mở khoá danh sách không?')) {
      return;
    }
    triggerHaptic(50);
    setState(prev => ({ ...prev, isLocked: false, updatedAt: Date.now() }));
  };

  const addIndividualRunner = (bib: string, name: string, gender: 'Nam' | 'Nữ' | 'Khác' = 'Nam') => {
    if (state.isLocked) return { success: false, error: 'Thông tin đã bị khoá. Vui lòng mở khoá để thêm VĐV mới.' };
    const cleanBib = bib.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanBib || !cleanName) return { success: false, error: 'Vui lòng nhập đầy đủ Số BIB và Tên VĐV' };

    const existsInd = state.individualRunners.some(r => r.bib.toUpperCase() === cleanBib);
    const existsTeam = state.teams.some(t => t.members.some(m => m.bib.toUpperCase() === cleanBib));
    if (existsInd || existsTeam) {
      return { success: false, error: `Số BIB ${cleanBib} đã tồn tại trong giải chạy!` };
    }

    const newRunner: IndividualRunner = {
      id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      bib: cleanBib,
      name: cleanName,
      gender,
      category: 'individual',
      status: 'not_started',
      startTime: null,
      finishTime: null,
      elapsedMs: null,
      adjustedElapsedMs: null,
    };

    setState(prev => ({
      ...prev,
      individualRunners: [...prev.individualRunners, newRunner],
      updatedAt: Date.now(),
    }));
    return { success: true };
  };

  const removeIndividualRunner = (id: string) => {
    if (state.isLocked) return;
    setState(prev => ({
      ...prev,
      individualRunners: prev.individualRunners.filter(r => r.id !== id),
      updatedAt: Date.now(),
    }));
  };

  const editIndividualRunner = (
    id: string,
    updates: { bib: string; name: string; gender?: 'Nam' | 'Nữ' | 'Khác' }
  ): { success: boolean; error?: string } => {
    const cleanBib = updates.bib.trim().toUpperCase();
    const cleanName = updates.name.trim();

    if (!cleanBib || !cleanName) {
      return { success: false, error: 'Vui lòng điền đủ số BIB và Họ tên VĐV' };
    }

    const dupInd = state.individualRunners.some(r => r.id !== id && r.bib.toUpperCase() === cleanBib);
    const dupTeam = state.teams.some(t => t.members.some(m => m.bib.toUpperCase() === cleanBib));

    if (dupInd || dupTeam) {
      return { success: false, error: `Số BIB ${cleanBib} đã được sử dụng bởi VĐV khác!` };
    }

    const now = Date.now();
    setState(prev => ({
      ...prev,
      individualRunners: prev.individualRunners.map(r => {
        if (r.id === id) {
          const newGender = updates.gender || r.gender || 'Nam';
          const newAdjustedElapsedMs = r.elapsedMs !== null
            ? (newGender === 'Nữ' ? Math.round(r.elapsedMs * 0.85) : r.elapsedMs)
            : r.adjustedElapsedMs;
          return {
            ...r,
            bib: cleanBib,
            name: cleanName,
            gender: newGender,
            adjustedElapsedMs: newAdjustedElapsedMs,
          };
        }
        return r;
      }),
      lastFinishedAction: prev.lastFinishedAction && prev.lastFinishedAction.runnerId === id
        ? { ...prev.lastFinishedAction, bib: cleanBib, runnerName: cleanName }
        : prev.lastFinishedAction,
      updatedAt: now,
    }));

    return { success: true };
  };

  const addTeam = (teamName: string, membersData: { bib: string; name: string }[]) => {
    if (state.isLocked) return { success: false, error: 'Thông tin đã bị khoá.' };
    const cleanTeamName = teamName.trim();
    if (!cleanTeamName) return { success: false, error: 'Vui lòng nhập tên đội' };
    if (membersData.length !== 3) return { success: false, error: 'Mỗi đội phải có chính xác 3 thành viên' };

    for (let i = 0; i < 3; i++) {
      const bib = membersData[i].bib.trim().toUpperCase();
      const name = membersData[i].name.trim();
      if (!bib || !name) {
        return { success: false, error: `Thành viên ${i + 1} chưa điền đủ BIB hoặc Tên` };
      }
    }

    const bibs = membersData.map(m => m.bib.trim().toUpperCase());
    if (new Set(bibs).size !== 3) {
      return { success: false, error: '3 thành viên trong đội không được trùng số BIB' };
    }

    const existingInd = state.individualRunners.map(r => r.bib.toUpperCase());
    const existingTeamBibs = state.teams.flatMap(t => t.members.map(m => m.bib.toUpperCase()));
    const allExisting = new Set([...existingInd, ...existingTeamBibs]);

    for (const b of bibs) {
      if (allExisting.has(b)) {
        return { success: false, error: `Số BIB ${b} đã tồn tại trong giải chạy!` };
      }
    }

    const members: [TeamMember, TeamMember, TeamMember] = [
      {
        id: `tm-${Date.now()}-1`,
        bib: bibs[0],
        name: membersData[0].name.trim(),
        status: 'not_started',
        startTime: null,
        finishTime: null,
        elapsedMs: null,
      },
      {
        id: `tm-${Date.now()}-2`,
        bib: bibs[1],
        name: membersData[1].name.trim(),
        status: 'not_started',
        startTime: null,
        finishTime: null,
        elapsedMs: null,
      },
      {
        id: `tm-${Date.now()}-3`,
        bib: bibs[2],
        name: membersData[2].name.trim(),
        status: 'not_started',
        startTime: null,
        finishTime: null,
        elapsedMs: null,
      },
    ];

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      teamName: cleanTeamName,
      category: 'team',
      members,
      status: 'not_started',
      totalElapsedMs: null,
      bestMemberElapsedMs: null,
      finishedCount: 0,
    };

    setState(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam],
      updatedAt: Date.now(),
    }));
    return { success: true };
  };

  const removeTeam = (id: string) => {
    if (state.isLocked) return;
    setState(prev => ({
      ...prev,
      teams: prev.teams.filter(t => t.id !== id),
      updatedAt: Date.now(),
    }));
  };

  const editTeam = (id: string, teamName: string, membersData: { bib: string; name: string }[]) => {
    if (state.isLocked) return { success: false, error: 'Thông tin đã bị khoá.' };
    const cleanTeamName = teamName.trim();
    if (!cleanTeamName) return { success: false, error: 'Tên đội không được rỗng' };
    if (membersData.length !== 3) return { success: false, error: 'Cần đủ 3 thành viên' };

    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== id) return t;
        const updatedMembers = t.members.map((m, idx) => ({
          ...m,
          bib: membersData[idx].bib.trim().toUpperCase(),
          name: membersData[idx].name.trim(),
        })) as [TeamMember, TeamMember, TeamMember];
        return {
          ...t,
          teamName: cleanTeamName,
          members: updatedMembers,
        };
      }),
      updatedAt: Date.now(),
    }));
    return { success: true };
  };

  const editTeamMember = (
    teamId: string,
    memberId: string,
    updates: { bib: string; name: string }
  ): { success: boolean; error?: string } => {
    const cleanBib = updates.bib.trim().toUpperCase();
    const cleanName = updates.name.trim();

    if (!cleanBib || !cleanName) {
      return { success: false, error: 'Vui lòng điền đủ số BIB và Họ tên VĐV' };
    }

    const dupInd = state.individualRunners.some(r => r.bib.toUpperCase() === cleanBib);
    const dupTeam = state.teams.some(t =>
      t.members.some(m => m.id !== memberId && m.bib.toUpperCase() === cleanBib)
    );

    if (dupInd || dupTeam) {
      return { success: false, error: `Số BIB ${cleanBib} đã được sử dụng bởi VĐV khác!` };
    }

    const now = Date.now();
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== teamId) return t;
        const updatedMembers = t.members.map(m => {
          if (m.id === memberId) {
            return {
              ...m,
              bib: cleanBib,
              name: cleanName,
            };
          }
          return m;
        }) as [TeamMember, TeamMember, TeamMember];
        return {
          ...t,
          members: updatedMembers,
        };
      }),
      lastFinishedAction: prev.lastFinishedAction && prev.lastFinishedAction.runnerId === memberId
        ? { ...prev.lastFinishedAction, bib: cleanBib, runnerName: cleanName }
        : prev.lastFinishedAction,
      updatedAt: now,
    }));

    return { success: true };
  };

  const loadSampleData = () => {
    if (state.isLocked) return;
    const sampleRunners: IndividualRunner[] = [
      { id: 'ind-1', bib: '101', name: 'Nguyễn Văn Hùng', gender: 'Nam', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
      { id: 'ind-2', bib: '102', name: 'Trần Thị Mai', gender: 'Nữ', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
      { id: 'ind-3', bib: '103', name: 'Lê Hoàng Nam', gender: 'Nam', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
      { id: 'ind-4', bib: '104', name: 'Phạm Minh Đức', gender: 'Nam', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
      { id: 'ind-5', bib: '105', name: 'Vũ Thuỳ Linh', gender: 'Nữ', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
      { id: 'ind-6', bib: '106', name: 'Hoàng Anh Tuấn', gender: 'Nam', category: 'individual', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null, adjustedElapsedMs: null },
    ];

    const sampleTeams: Team[] = [
      {
        id: 'team-1',
        teamName: 'Tia Chớp Runner Club',
        category: 'team',
        status: 'not_started',
        totalElapsedMs: null,
        bestMemberElapsedMs: null,
        finishedCount: 0,
        members: [
          { id: 'tm-1-1', bib: 'T01', name: 'Đặng Quốc Huy', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
          { id: 'tm-1-2', bib: 'T02', name: 'Ngô Thanh Tùng', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
          { id: 'tm-1-3', bib: 'T03', name: 'Bùi Gia Bảo', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
        ]
      },
      {
        id: 'team-2',
        teamName: 'Chiến Binh Marathon',
        category: 'team',
        status: 'not_started',
        totalElapsedMs: null,
        bestMemberElapsedMs: null,
        finishedCount: 0,
        members: [
          { id: 'tm-2-1', bib: 'T04', name: 'Võ Minh Trí', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
          { id: 'tm-2-2', bib: 'T05', name: 'Lý Kiến Khang', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
          { id: 'tm-2-3', bib: 'T06', name: 'Dương Văn Toàn', status: 'not_started', startTime: null, finishTime: null, elapsedMs: null },
        ]
      }
    ];

    setState(prev => ({
      ...prev,
      individualRunners: sampleRunners,
      teams: sampleTeams,
      updatedAt: Date.now(),
    }));
  };

  const clearAllData = () => {
    if (confirm('Bạn có chắc chắn muốn xoá toàn bộ danh sách vận động viên và đội không?')) {
      setState({
        ...initialRaceState,
        roomCode: state.roomCode,
        refereePin: state.refereePin,
        updatedAt: Date.now(),
      });
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // --- TIMING STARTS ---

  // 1. Xuất phát chung (Mass Start - cả 2 bảng)
  const startRace = () => {
    const totalParticipants = state.individualRunners.length + state.teams.reduce((acc, t) => acc + t.members.length, 0);
    if (totalParticipants === 0) {
      alert('Vui lòng thêm vận động viên hoặc nạp dữ liệu mẫu trước khi xuất phát!');
      return;
    }

    if (!state.isLocked) {
      if (!confirm('Thông tin chưa được khoá. Hệ thống sẽ tự động khoá thông tin và bắt đầu xuất phát chung ngay bây giờ?')) {
        return;
      }
    }

    const now = Date.now();
    sound.playStart();
    triggerHaptic([60, 40, 100]);

    setState(prev => ({
      ...prev,
      isLocked: true,
      isStarted: true,
      isPaused: false,
      startTime: now,
      endTime: null,
      individualStartTime: now,
      individualEndTime: null,
      individualStarted: true,
      teamStartTime: now,
      teamEndTime: null,
      teamStarted: true,
      totalPausedMs: 0,
      individualRunners: prev.individualRunners.map(r => ({
        ...r,
        status: 'running',
        startTime: now,
        finishTime: null,
        elapsedMs: null,
        adjustedElapsedMs: null,
      })),
      teams: prev.teams.map(t => ({
        ...t,
        status: 'running',
        totalElapsedMs: null,
        bestMemberElapsedMs: null,
        finishedCount: 0,
        members: t.members.map(m => ({
          ...m,
          status: 'running',
          startTime: now,
          finishTime: null,
          elapsedMs: null,
        })) as [TeamMember, TeamMember, TeamMember],
      })),
      updatedAt: now,
    }));
  };

  // 2. Xuất phát riêng Bảng Cá Nhân
  const startIndividualRace = () => {
    if (state.individualRunners.length === 0) {
      alert('Bảng cá nhân chưa có vận động viên nào!');
      return;
    }

    const now = Date.now();
    sound.playStart();
    triggerHaptic([60, 40, 100]);

    setState(prev => ({
      ...prev,
      isLocked: true,
      isStarted: true,
      startTime: prev.startTime || now,
      individualStartTime: now,
      individualEndTime: null,
      individualStarted: true,
      individualRunners: prev.individualRunners.map(r => ({
        ...r,
        status: 'running',
        startTime: now,
        finishTime: null,
        elapsedMs: null,
        adjustedElapsedMs: null,
      })),
      updatedAt: now,
    }));
  };

  // 3. Xuất phát riêng Bảng Đồng Đội
  const startTeamRace = () => {
    if (state.teams.length === 0) {
      alert('Bảng đồng đội chưa có đội nào!');
      return;
    }

    const now = Date.now();
    sound.playStart();
    triggerHaptic([60, 40, 100]);

    setState(prev => ({
      ...prev,
      isLocked: true,
      isStarted: true,
      startTime: prev.startTime || now,
      teamStartTime: now,
      teamEndTime: null,
      teamStarted: true,
      teams: prev.teams.map(t => ({
        ...t,
        status: 'running',
        totalElapsedMs: null,
        bestMemberElapsedMs: null,
        finishedCount: 0,
        members: t.members.map(m => ({
          ...m,
          status: 'running',
          startTime: now,
          finishTime: null,
          elapsedMs: null,
        })) as [TeamMember, TeamMember, TeamMember],
      })),
      updatedAt: now,
    }));
  };

  // --- FINISH ACTIONS ---

  const recordFinishById = (id: string, type: 'individual' | 'team_member', teamId?: string): boolean => {
    if (!state.isStarted) return false;
    const now = Date.now();

    sound.playFinish();
    triggerHaptic([50, 40, 60]);

    if (type === 'individual') {
      const runner = state.individualRunners.find(r => r.id === id);
      if (!runner || runner.status !== 'running') return false;

      const runnerStart = runner.startTime || state.individualStartTime || state.startTime || now;
      const elapsed = Math.max(0, now - runnerStart - state.totalPausedMs);
      const adjustedElapsed = runner.gender === 'Nữ' ? Math.round(elapsed * 0.85) : elapsed;

      const updatedInd = state.individualRunners.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'finished' as RunnerStatus,
            finishTime: now,
            elapsedMs: elapsed,
            adjustedElapsedMs: adjustedElapsed,
          };
        }
        return r;
      });

      const stillRunningInd = updatedInd.filter(r => r.status === 'running').length;
      const isIndComplete = state.individualStarted && stillRunningInd === 0;

      const stillRunningTeam = state.teams.reduce(
        (acc, t) => acc + t.members.filter(m => m.status === 'running').length,
        0
      );
      const isTeamComplete = state.teamStarted && stillRunningTeam === 0;

      // Entire race finishes when all active runners from started groups finish
      const isAllComplete = (stillRunningInd + stillRunningTeam) === 0 && (state.individualStarted || state.teamStarted);

      if (isAllComplete || isIndComplete) {
        sound.playRaceComplete();
        triggerHaptic([100, 50, 100, 50, 200]);
      }

      setState(prev => ({
        ...prev,
        individualEndTime: isIndComplete ? now : prev.individualEndTime,
        endTime: isAllComplete ? now : prev.endTime,
        lastFinishedAction: {
          type: 'individual',
          runnerId: runner.id,
          previousStatus: runner.status,
          previousFinishTime: runner.finishTime,
          timestamp: now,
          runnerName: runner.name,
          bib: runner.bib,
        },
        individualRunners: updatedInd,
        updatedAt: now,
      }));
      return true;
    } else if (type === 'team_member' && teamId) {
      const team = state.teams.find(t => t.id === teamId);
      if (!team) return false;
      const member = team.members.find(m => m.id === id);
      if (!member || member.status !== 'running') return false;

      const memberStart = member.startTime || state.teamStartTime || state.startTime || now;
      const elapsed = Math.max(0, now - memberStart - state.totalPausedMs);

      const updatedTeams = state.teams.map(t => {
        if (t.id !== teamId) return t;
        const updatedMembers = t.members.map(m => {
          if (m.id === id) {
            return {
              ...m,
              status: 'finished' as RunnerStatus,
              finishTime: now,
              elapsedMs: elapsed,
            };
          }
          return m;
        }) as [TeamMember, TeamMember, TeamMember];

        const finishedCount = updatedMembers.filter(m => m.status === 'finished').length;
        const allFinished = finishedCount === 3;
        let totalElapsedMs: number | null = null;
        let bestMemberElapsedMs: number | null = null;
        if (allFinished) {
          totalElapsedMs = updatedMembers.reduce((sum, m) => sum + (m.elapsedMs || 0), 0);
          const validTimes = updatedMembers.map(m => m.elapsedMs).filter((t): t is number => t !== null);
          bestMemberElapsedMs = validTimes.length > 0 ? Math.min(...validTimes) : null;
        }

        return {
          ...t,
          members: updatedMembers,
          finishedCount,
          status: (allFinished ? 'finished' : 'running') as RunnerStatus,
          totalElapsedMs,
          bestMemberElapsedMs,
        };
      });

      const stillRunningInd = state.individualRunners.filter(r => r.status === 'running').length;
      const isIndComplete = state.individualStarted && stillRunningInd === 0;

      const stillRunningTeam = updatedTeams.reduce(
        (acc, t) => acc + t.members.filter(m => m.status === 'running').length,
        0
      );
      const isTeamComplete = state.teamStarted && stillRunningTeam === 0;
      const isAllComplete = (stillRunningInd + stillRunningTeam) === 0 && (state.individualStarted || state.teamStarted);

      if (isAllComplete || isTeamComplete) {
        sound.playRaceComplete();
        triggerHaptic([100, 50, 100, 50, 200]);
      }

      setState(prev => ({
        ...prev,
        teamEndTime: isTeamComplete ? now : prev.teamEndTime,
        endTime: isAllComplete ? now : prev.endTime,
        lastFinishedAction: {
          type: 'team_member',
          runnerId: member.id,
          teamId,
          previousStatus: member.status,
          previousFinishTime: member.finishTime,
          timestamp: now,
          runnerName: member.name,
          bib: member.bib,
        },
        teams: updatedTeams,
        updatedAt: now,
      }));
      return true;
    }

    return false;
  };

  const recordFinishByBib = (bib: string): { success: boolean; message: string } => {
    if (!state.isStarted) {
      return { success: false, message: 'Giải chạy chưa xuất phát!' };
    }
    const cleanBib = bib.trim().toUpperCase();
    if (!cleanBib) {
      return { success: false, message: 'Vui lòng nhập số BIB' };
    }

    // Check individual runners
    const ind = state.individualRunners.find(r => r.bib.toUpperCase() === cleanBib);
    if (ind) {
      if (!state.individualStarted) {
        return { success: false, message: `Bảng cá nhân chưa xuất phát!` };
      }
      if (ind.status === 'finished') {
        return { success: false, message: `BIB #${cleanBib} (${ind.name}) đã về đích trước đó rồi!` };
      }
      if (ind.status !== 'running') {
        return { success: false, message: `BIB #${cleanBib} chưa ở trạng thái đang chạy` };
      }
      recordFinishById(ind.id, 'individual');
      return { success: true, message: `Đã ghi nhận BIB #${cleanBib} (${ind.name}) về đích!` };
    }

    // Check team members
    for (const t of state.teams) {
      const member = t.members.find(m => m.bib.toUpperCase() === cleanBib);
      if (member) {
        if (!state.teamStarted) {
          return { success: false, message: `Bảng đồng đội chưa xuất phát!` };
        }
        if (member.status === 'finished') {
          return { success: false, message: `BIB #${cleanBib} (${member.name} - Đội ${t.teamName}) đã về đích rồi!` };
        }
        if (member.status !== 'running') {
          return { success: false, message: `BIB #${cleanBib} chưa ở trạng thái đang chạy` };
        }
        recordFinishById(member.id, 'team_member', t.id);
        return { success: true, message: `Đã ghi nhận BIB #${cleanBib} (${member.name} - Đội ${t.teamName}) về đích!` };
      }
    }

    return { success: false, message: `Không tìm thấy vận động viên có số BIB #${cleanBib}` };
  };

  const markDNF = (bib: string) => {
    const cleanBib = bib.trim().toUpperCase();
    setState(prev => {
      const now = Date.now();
      const updatedInd = prev.individualRunners.map(r => {
        if (r.bib.toUpperCase() === cleanBib) {
          return { ...r, status: 'dnf' as RunnerStatus, finishTime: null, elapsedMs: null };
        }
        return r;
      });
      const updatedTeams = prev.teams.map(t => {
        const updatedMembers = t.members.map(m => {
          if (m.bib.toUpperCase() === cleanBib) {
            return { ...m, status: 'dnf' as RunnerStatus, finishTime: null, elapsedMs: null };
          }
          return m;
        }) as [TeamMember, TeamMember, TeamMember];
        return { ...t, members: updatedMembers };
      });

      const stillRunningInd = updatedInd.filter(r => r.status === 'running').length;
      const stillRunningTeam = updatedTeams.reduce(
        (acc, t) => acc + t.members.filter(m => m.status === 'running').length,
        0
      );
      const isRaceComplete = (stillRunningInd + stillRunningTeam) === 0 && (prev.individualStarted || prev.teamStarted);

      return {
        ...prev,
        endTime: isRaceComplete ? now : prev.endTime,
        individualRunners: updatedInd,
        teams: updatedTeams,
        updatedAt: now,
      };
    });
  };

  const undoLastFinish = (): boolean => {
    if (!state.lastFinishedAction) return false;
    const action = state.lastFinishedAction;
    sound.playUndo();
    triggerHaptic([30, 30]);

    const now = Date.now();
    setState(prev => {
      if (action.type === 'individual') {
        return {
          ...prev,
          endTime: null,
          individualEndTime: null,
          lastFinishedAction: null,
          individualRunners: prev.individualRunners.map(r => {
            if (r.id === action.runnerId) {
              return {
                ...r,
                status: action.previousStatus,
                finishTime: action.previousFinishTime,
                elapsedMs: null,
                adjustedElapsedMs: null,
              };
            }
            return r;
          }),
          updatedAt: now,
        };
      } else if (action.type === 'team_member' && action.teamId) {
        return {
          ...prev,
          endTime: null,
          teamEndTime: null,
          lastFinishedAction: null,
          teams: prev.teams.map(t => {
            if (t.id !== action.teamId) return t;
            const updatedMembers = t.members.map(m => {
              if (m.id === action.runnerId) {
                return {
                  ...m,
                  status: action.previousStatus,
                  finishTime: action.previousFinishTime,
                  elapsedMs: null,
                };
              }
              return m;
            }) as [TeamMember, TeamMember, TeamMember];

            const finishedCount = updatedMembers.filter(m => m.status === 'finished').length;
            return {
              ...t,
              members: updatedMembers,
              finishedCount,
              status: (finishedCount === 3 ? 'finished' : 'running') as RunnerStatus,
              totalElapsedMs: null,
              bestMemberElapsedMs: null,
            };
          }),
          updatedAt: now,
        };
      }
      return prev;
    });

    return true;
  };

  const resetRaceTimer = () => {
    if (!confirm('Bạn có chắc chắn muốn đặt lại đồng hồ bấm giờ? (Thông tin VĐV vẫn được giữ nguyên)')) {
      return;
    }
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isStarted: false,
      isPaused: false,
      startTime: null,
      endTime: null,
      individualStartTime: null,
      individualEndTime: null,
      individualStarted: false,
      teamStartTime: null,
      teamEndTime: null,
      teamStarted: false,
      totalPausedMs: 0,
      lastFinishedAction: null,
      individualRunners: prev.individualRunners.map(r => ({
        ...r,
        status: 'not_started',
        startTime: null,
        finishTime: null,
        elapsedMs: null,
        adjustedElapsedMs: null,
      })),
      teams: prev.teams.map(t => ({
        ...t,
        status: 'not_started',
        totalElapsedMs: null,
        bestMemberElapsedMs: null,
        finishedCount: 0,
        members: t.members.map(m => ({
          ...m,
          status: 'not_started',
          startTime: null,
          finishTime: null,
          elapsedMs: null,
        })) as [TeamMember, TeamMember, TeamMember],
      })),
      updatedAt: now,
    }));
  };

  return (
    <RaceContext.Provider
      value={{
        state,
        role,
        setRole,
        roomCode: state.roomCode,
        setRoomCode,
        connectedViewers,
        isOnlineSyncActive,
        lastSyncTime,
        setRaceName,
        lockInformation,
        unlockInformation,
        addIndividualRunner,
        removeIndividualRunner,
        editIndividualRunner,
        addTeam,
        removeTeam,
        editTeam,
        editTeamMember,
        loadSampleData,
        clearAllData,
        startRace,
        startIndividualRace,
        startTeamRace,
        recordFinishByBib,
        recordFinishById,
        markDNF,
        undoLastFinish,
        resetRaceTimer,
        verifyRefereePin,
        changeRefereePin,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export function useRace() {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRace must be used within a RaceProvider');
  }
  return context;
}
