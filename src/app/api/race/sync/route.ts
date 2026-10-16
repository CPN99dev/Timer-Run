import { NextResponse } from 'next/server';
import { RaceState } from '@/types/race';
import { OFFICIAL_INDIVIDUAL_RUNNERS, OFFICIAL_TEAMS } from '@/data/officialRaceData';

interface GlobalRaceStore {
  [roomCode: string]: {
    state: RaceState;
    updatedAt: number;
  };
}

const defaultInitialState: RaceState = {
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
  individualRunners: OFFICIAL_INDIVIDUAL_RUNNERS,
  teams: OFFICIAL_TEAMS,
  lastFinishedAction: null,
  roomCode: 'RUN2026',
  refereePin: '8888',
  updatedAt: Date.now(),
};

// Pre-initialize server-side room RUN2026 with official participants
const raceStore: GlobalRaceStore = {
  RUN2026: {
    state: defaultInitialState,
    updatedAt: Date.now(),
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = (searchParams.get('room') || 'RUN2026').toUpperCase();

  let entry = raceStore[roomCode];
  if (!entry) {
    // If room is accessed for the first time, initialize with official data
    const now = Date.now();
    entry = {
      state: {
        ...defaultInitialState,
        roomCode,
        updatedAt: now,
      },
      updatedAt: now,
    };
    raceStore[roomCode] = entry;
  }

  return NextResponse.json({
    found: true,
    roomCode,
    state: entry.state,
    updatedAt: entry.updatedAt,
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, state } = body as { roomCode: string; state: RaceState };

    if (!roomCode || !state) {
      return NextResponse.json({ error: 'Missing roomCode or state' }, { status: 400 });
    }

    const code = roomCode.toUpperCase();
    const now = Date.now();
    raceStore[code] = {
      state: {
        ...state,
        updatedAt: now,
      },
      updatedAt: now,
    };

    return NextResponse.json({ success: true, roomCode: code, updatedAt: now });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
