import { NextResponse } from 'next/server';
import { RaceState } from '@/types/race';

// In-memory store for active room states
// (Can also optionally sync with Vercel KV / Upstash Redis if env vars provided)
interface GlobalRaceStore {
  [roomCode: string]: {
    state: RaceState;
    updatedAt: number;
  };
}

const raceStore: GlobalRaceStore = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = (searchParams.get('room') || 'default').toUpperCase();

  const entry = raceStore[roomCode];
  if (!entry) {
    return NextResponse.json({ found: false, message: 'Room not initialized' }, { status: 404 });
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
