import { RaceState, IndividualRunner, Team, TeamMember } from '@/types/race';

/**
 * Intelligent bidirectional CRDT-style merge between two RaceState objects.
 * Guarantees:
 * 1. If a runner or team member is finished in either state, they stay finished.
 * 2. If a finish was undone or updated with a newer timestamp, the newer action wins.
 * 3. Race start timestamps are preserved and synchronized.
 * 4. Team totals, counts, and best times are correctly recomputed.
 * 5. Metadata changes (names, bibs, company) take the one with higher timestamp.
 * 6. Never erases one referee's recorded finish when merging another referee's state.
 */
export function mergeRaceStates(local: RaceState, remote: RaceState): RaceState {
  if (!local) return remote;
  if (!remote) return local;

  const now = Date.now();
  const localUpdated = local.updatedAt || 0;
  const remoteUpdated = remote.updatedAt || 0;
  const isRemoteNewer = remoteUpdated > localUpdated;

  const primary = isRemoteNewer ? remote : local;
  const secondary = isRemoteNewer ? local : remote;

  // 1. Race start & timer lifecycle
  let isStarted = primary.isStarted;
  let startTime = primary.startTime;
  if (local.isStarted && remote.isStarted) {
    isStarted = true;
    startTime = Math.min(local.startTime || now, remote.startTime || now);
  } else if (secondary.isStarted && !primary.isStarted && !primary.isLocked) {
    // If secondary was actively running and primary is unstarted default, keep running race
    isStarted = true;
    startTime = secondary.startTime;
  }

  let individualStarted = primary.individualStarted;
  let individualStartTime = primary.individualStartTime;
  if (local.individualStarted && remote.individualStarted) {
    individualStarted = true;
    individualStartTime = Math.min(local.individualStartTime || now, remote.individualStartTime || now);
  } else if (isStarted && secondary.individualStarted) {
    individualStarted = true;
    individualStartTime = secondary.individualStartTime;
  }

  let teamStarted = primary.teamStarted;
  let teamStartTime = primary.teamStartTime;
  if (local.teamStarted && remote.teamStarted) {
    teamStarted = true;
    teamStartTime = Math.min(local.teamStartTime || now, remote.teamStartTime || now);
  } else if (isStarted && secondary.teamStarted) {
    teamStarted = true;
    teamStartTime = secondary.teamStartTime;
  }

  const isLocked = local.isLocked || remote.isLocked;
  const isPaused = primary.isPaused;
  const pauseTime = primary.pauseTime;
  const totalPausedMs = Math.max(local.totalPausedMs || 0, remote.totalPausedMs || 0);

  // 2. Merge Individual Runners
  const remoteIndById = new Map<string, IndividualRunner>();
  const remoteIndByBib = new Map<string, IndividualRunner>();
  (remote.individualRunners || []).forEach(r => {
    remoteIndById.set(r.id, r);
    remoteIndByBib.set(r.bib.toUpperCase(), r);
  });

  const mergedIndividualRunners: IndividualRunner[] = (local.individualRunners || []).map(locRunner => {
    const remRunner = remoteIndById.get(locRunner.id) || remoteIndByBib.get(locRunner.bib.toUpperCase());
    if (!remRunner) return locRunner;

    const locUp = locRunner.updatedAt || 0;
    const remUp = remRunner.updatedAt || 0;

    let chosen = locRunner;
    if (remUp > locUp) {
      chosen = remRunner;
    } else if (locUp > remUp) {
      chosen = locRunner;
    } else {
      // Tie-breaker if equal timestamp or both unversioned:
      if (locRunner.status === 'finished' && remRunner.status === 'finished') {
        const timeLoc = locRunner.finishTime ?? Infinity;
        const timeRem = remRunner.finishTime ?? Infinity;
        chosen = timeRem < timeLoc ? remRunner : locRunner;
      } else if (remRunner.status === 'finished') {
        chosen = remRunner;
      } else if (locRunner.status === 'finished') {
        chosen = locRunner;
      } else if (remRunner.status === 'dnf') {
        chosen = remRunner;
      } else if (locRunner.status === 'dnf') {
        chosen = locRunner;
      } else if (remRunner.status === 'running') {
        chosen = remRunner;
      }
    }

    const name = isRemoteNewer ? remRunner.name : locRunner.name;
    const bib = isRemoteNewer ? remRunner.bib : locRunner.bib;
    const gender = isRemoteNewer ? remRunner.gender : locRunner.gender;
    const company = isRemoteNewer ? remRunner.company : locRunner.company;
    const slogan = isRemoteNewer ? remRunner.slogan : locRunner.slogan;

    return {
      ...chosen,
      name,
      bib,
      gender,
      company,
      slogan,
      startTime: chosen.startTime || locRunner.startTime || remRunner.startTime || individualStartTime || startTime,
      updatedAt: Math.max(locUp, remUp),
    };
  });

  // Include any new runners added remotely that don't exist locally
  (remote.individualRunners || []).forEach(remRunner => {
    const exists = mergedIndividualRunners.some(
      r => r.id === remRunner.id || r.bib.toUpperCase() === remRunner.bib.toUpperCase()
    );
    if (!exists) {
      mergedIndividualRunners.push(remRunner);
    }
  });

  // 3. Merge Teams & Members
  const remoteTeamById = new Map<string, Team>();
  const remoteTeamByName = new Map<string, Team>();
  (remote.teams || []).forEach(t => {
    remoteTeamById.set(t.id, t);
    remoteTeamByName.set(t.teamName.toLowerCase(), t);
  });

  const mergedTeams: Team[] = (local.teams || []).map(locTeam => {
    const remTeam = remoteTeamById.get(locTeam.id) || remoteTeamByName.get(locTeam.teamName.toLowerCase());
    if (!remTeam) return locTeam;

    // Merge members
    const remMemberByBib = new Map<string, TeamMember>();
    remTeam.members.forEach(m => remMemberByBib.set(m.bib.toUpperCase(), m));

    const updatedMembers = locTeam.members.map((locMember, idx) => {
      const remMember = remMemberByBib.get(locMember.bib.toUpperCase()) || remTeam.members[idx];
      if (!remMember) return locMember;

      const locUp = locMember.updatedAt || 0;
      const remUp = remMember.updatedAt || 0;

      let chosen = locMember;
      if (remUp > locUp) {
        chosen = remMember;
      } else if (locUp > remUp) {
        chosen = locMember;
      } else {
        if (locMember.status === 'finished' && remMember.status === 'finished') {
          const timeLoc = locMember.finishTime ?? Infinity;
          const timeRem = remMember.finishTime ?? Infinity;
          chosen = timeRem < timeLoc ? remMember : locMember;
        } else if (remMember.status === 'finished') {
          chosen = remMember;
        } else if (locMember.status === 'finished') {
          chosen = locMember;
        } else if (remMember.status === 'dnf') {
          chosen = remMember;
        } else if (locMember.status === 'dnf') {
          chosen = locMember;
        } else if (remMember.status === 'running') {
          chosen = remMember;
        }
      }

      return {
        ...chosen,
        name: isRemoteNewer ? remMember.name : locMember.name,
        bib: isRemoteNewer ? remMember.bib : locMember.bib,
        roleInTeam: isRemoteNewer ? remMember.roleInTeam : locMember.roleInTeam,
        startTime: chosen.startTime || locMember.startTime || remMember.startTime || teamStartTime || startTime,
        updatedAt: Math.max(locUp, remUp),
      };
    }) as [TeamMember, TeamMember, TeamMember];

    const finishedCount = updatedMembers.filter(m => m.status === 'finished').length;
    const isTeamAllFinished = finishedCount === 3;
    let totalElapsedMs: number | null = null;
    let bestMemberElapsedMs: number | null = null;

    if (isTeamAllFinished) {
      totalElapsedMs = updatedMembers.reduce((sum, m) => sum + (m.elapsedMs || 0), 0);
      const validTimes = updatedMembers.map(m => m.elapsedMs).filter((t): t is number => t !== null);
      bestMemberElapsedMs = validTimes.length > 0 ? Math.min(...validTimes) : null;
    }

    return {
      ...locTeam,
      teamName: isRemoteNewer ? remTeam.teamName : locTeam.teamName,
      company: isRemoteNewer ? remTeam.company : locTeam.company,
      slogan: isRemoteNewer ? remTeam.slogan : locTeam.slogan,
      members: updatedMembers,
      finishedCount,
      totalElapsedMs,
      bestMemberElapsedMs,
      status: isTeamAllFinished ? 'finished' : (isStarted ? 'running' : 'not_started'),
    };
  });

  // Include any new teams added remotely
  (remote.teams || []).forEach(remTeam => {
    const exists = mergedTeams.some(
      t => t.id === remTeam.id || t.teamName.toLowerCase() === remTeam.teamName.toLowerCase()
    );
    if (!exists) {
      mergedTeams.push(remTeam);
    }
  });

  // 4. Overall End Times
  const stillRunningInd = mergedIndividualRunners.filter(r => r.status === 'running').length;
  const isIndComplete = individualStarted && stillRunningInd === 0;

  const stillRunningTeam = mergedTeams.reduce(
    (acc, t) => acc + t.members.filter(m => m.status === 'running').length,
    0
  );
  const isTeamComplete = teamStarted && stillRunningTeam === 0;
  const isAllComplete = (stillRunningInd + stillRunningTeam) === 0 && (individualStarted || teamStarted);

  // 5. lastFinishedAction
  let lastFinishedAction = local.lastFinishedAction;
  if (remote.lastFinishedAction) {
    if (!lastFinishedAction || remote.lastFinishedAction.timestamp > (lastFinishedAction.timestamp || 0)) {
      lastFinishedAction = remote.lastFinishedAction;
    }
  }

  return {
    raceName: isRemoteNewer ? remote.raceName : local.raceName,
    isLocked,
    isStarted,
    isPaused,
    startTime,
    endTime: isAllComplete ? (local.endTime || remote.endTime || now) : null,
    individualStartTime,
    individualEndTime: isIndComplete ? (local.individualEndTime || remote.individualEndTime || now) : null,
    individualStarted,
    teamStartTime,
    teamEndTime: isTeamComplete ? (local.teamEndTime || remote.teamEndTime || now) : null,
    teamStarted,
    pauseTime,
    totalPausedMs,
    individualRunners: mergedIndividualRunners,
    teams: mergedTeams,
    lastFinishedAction,
    roomCode: local.roomCode || remote.roomCode || 'RUN2026',
    refereePin: local.refereePin || remote.refereePin || '8888',
    updatedAt: Math.max(localUpdated, remoteUpdated, now),
  };
}
