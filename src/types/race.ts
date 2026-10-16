export type RunnerStatus = 'not_started' | 'running' | 'finished' | 'dnf';

export interface IndividualRunner {
  id: string;
  bib: string;
  name: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  company?: string;
  slogan?: string;
  category: 'individual';
  status: RunnerStatus;
  startTime: number | null; // epoch timestamp ms
  finishTime: number | null; // epoch timestamp ms
  elapsedMs: number | null; // Thời gian chạy thực tế
  adjustedElapsedMs: number | null; // Thời gian xếp hạng (Nữ × 0.85, Nam × 1.0)
  rank?: number;
  updatedAt?: number;
}

export interface TeamMember {
  id: string;
  bib: string;
  name: string;
  roleInTeam?: 'Leader' | 'Nhân viên' | string;
  status: RunnerStatus;
  startTime: number | null;
  finishTime: number | null;
  elapsedMs: number | null;
  updatedAt?: number;
}

export interface Team {
  id: string;
  teamName: string;
  slogan?: string;
  company?: string;
  category: 'team';
  members: [TeamMember, TeamMember, TeamMember]; // exactly 3 runners
  status: RunnerStatus; // 'finished' when all 3 finish
  totalElapsedMs: number | null; // Tổng thời gian hoàn thành thực tế của 03 thành viên
  bestMemberElapsedMs: number | null; // Thời gian của thành viên về nhanh nhất (xét khi bằng tổng thời gian)
  finishedCount: number; // 0, 1, 2, or 3
  rank?: number;
}

export type ActiveTab = 'setup' | 'timing' | 'leaderboard';
export type ActiveCategory = 'all' | 'individual' | 'team';
export type UserRole = 'referee' | 'viewer';

export interface RaceState {
  raceName: string;
  isLocked: boolean; // Khoá thông tin
  isStarted: boolean;
  isPaused: boolean;
  startTime: number | null; // Overall / earliest start time
  endTime: number | null;
  
  // Independent Category Starts
  individualStartTime: number | null;
  individualEndTime: number | null;
  individualStarted: boolean;

  teamStartTime: number | null;
  teamEndTime: number | null;
  teamStarted: boolean;

  pauseTime: number | null;
  totalPausedMs: number;
  individualRunners: IndividualRunner[];
  teams: Team[];
  lastFinishedAction: {
    type: 'individual' | 'team_member';
    runnerId: string;
    teamId?: string;
    previousStatus: RunnerStatus;
    previousFinishTime: number | null;
    timestamp: number;
    runnerName: string;
    bib: string;
  } | null;
  roomCode: string;
  refereePin: string; // PIN to authorize referee mode (default: '8888')
  updatedAt: number;
}

export interface SyncMessage {
  type: 'RACE_UPDATE' | 'REQUEST_SYNC' | 'PING' | 'PONG';
  roomCode: string;
  state?: RaceState;
  timestamp: number;
}
