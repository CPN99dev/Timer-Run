import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RaceState } from '@/types/race';
import { OFFICIAL_INDIVIDUAL_RUNNERS, OFFICIAL_TEAMS } from '@/data/officialRaceData';
import { mergeRaceStates } from '@/utils/mergeRaceState';

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

// Use globalThis to persist store across warm serverless invocations
const globalForRace = globalThis as unknown as { __raceStore?: GlobalRaceStore };
if (!globalForRace.__raceStore) {
  globalForRace.__raceStore = {
    RUN2026: {
      state: defaultInitialState,
      updatedAt: Date.now(),
    }
  };
}
const raceStore = globalForRace.__raceStore;

// /tmp disk backup for cross-lambda resilience on Vercel
function getTmpFilePath(roomCode: string) {
  return path.join('/tmp', `race_${roomCode.toUpperCase()}.json`);
}

function loadStateFromDisk(roomCode: string): RaceState | null {
  try {
    const file = getTmpFilePath(roomCode);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function saveStateToDisk(roomCode: string, state: RaceState) {
  try {
    const file = getTmpFilePath(roomCode);
    fs.writeFileSync(file, JSON.stringify(state), 'utf-8');
  } catch {
    // ignore
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = (searchParams.get('room') || 'RUN2026').toUpperCase();
  const since = parseInt(searchParams.get('since') || '0', 10);

  let entry = raceStore[roomCode];
  if (!entry) {
    const diskState = loadStateFromDisk(roomCode);
    if (diskState) {
      entry = {
        state: diskState,
        updatedAt: diskState.updatedAt || Date.now(),
      };
      raceStore[roomCode] = entry;
    } else {
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
      saveStateToDisk(roomCode, entry.state);
    }
  }

  // If client provided a 'since' timestamp and nothing changed, return lightweight response
  if (since > 0 && entry.updatedAt <= since) {
    return NextResponse.json({
      found: true,
      changed: false,
      roomCode,
      updatedAt: entry.updatedAt,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  }

  return NextResponse.json({
    found: true,
    changed: true,
    roomCode,
    state: entry.state,
    updatedAt: entry.updatedAt,
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomCode, state: incomingState } = body as { roomCode: string; state: RaceState };

    if (!roomCode || !incomingState) {
      return NextResponse.json({ error: 'Missing roomCode or state' }, { status: 400 });
    }

    const code = roomCode.toUpperCase();
    const now = Date.now();

    // 1. Get current server state
    let currentServerState = raceStore[code]?.state;
    if (!currentServerState) {
      currentServerState = loadStateFromDisk(code) || {
        ...defaultInitialState,
        roomCode: code,
        updatedAt: now,
      };
    }

    // 2. Intelligently merge the incoming state with the current server state
    // so no other referee's recorded finishes are lost!
    const mergedState = mergeRaceStates(currentServerState, incomingState);
    mergedState.updatedAt = now;

    // 3. Persist merged state
    raceStore[code] = {
      state: mergedState,
      updatedAt: now,
    };
    saveStateToDisk(code, mergedState);

    // 4. Return merged state immediately to the caller
    return NextResponse.json({
      success: true,
      roomCode: code,
      state: mergedState,
      updatedAt: now,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
