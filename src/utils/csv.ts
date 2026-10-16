import { IndividualRunner, Team } from '@/types/race';
import { formatElapsed, formatTimeOfDay } from './time';

/**
 * Escapes CSV field if it contains commas, quotes, or newlines
 */
function escapeCSV(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '""';
  const str = String(text);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function triggerDownload(content: string, filename: string) {
  // UTF-8 BOM: \uFEFF ensures Excel displays Vietnamese correctly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportIndividualCSV(runners: IndividualRunner[], raceName: string) {
  const sorted = [...runners].sort((a, b) => {
    if (a.status === 'finished' && b.status === 'finished') {
      return (a.elapsedMs || 0) - (b.elapsedMs || 0);
    }
    if (a.status === 'finished') return -1;
    if (b.status === 'finished') return 1;
    return a.bib.localeCompare(b.bib);
  });

  const headers = ['Xếp Hạng', 'Số BIB', 'Họ Và Tên', 'Giới Tính', 'Trạng Thái', 'Thời Gian Hoàn Thành', 'Giờ Xuất Phát', 'Giờ Về Đích'];
  
  const rows = sorted.map((r, idx) => {
    const rank = r.status === 'finished' ? idx + 1 : '-';
    const statusText = 
      r.status === 'finished' ? 'Đã về đích' :
      r.status === 'running' ? 'Đang chạy' :
      r.status === 'dnf' ? 'Không hoàn thành (DNF)' : 'Chưa xuất phát';

    return [
      escapeCSV(rank),
      escapeCSV(r.bib),
      escapeCSV(r.name),
      escapeCSV(r.gender || 'Không ghi'),
      escapeCSV(statusText),
      escapeCSV(formatElapsed(r.elapsedMs)),
      escapeCSV(formatTimeOfDay(r.startTime)),
      escapeCSV(formatTimeOfDay(r.finishTime)),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const sanitizedRace = raceName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  triggerDownload(csvContent, `Ket_qua_Ca_nhan_${sanitizedRace}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportTeamCSV(teams: Team[], raceName: string) {
  const sorted = [...teams].sort((a, b) => {
    if (a.finishedCount === 3 && b.finishedCount === 3) {
      return (a.averageElapsedMs || 0) - (b.averageElapsedMs || 0);
    }
    if (a.finishedCount !== b.finishedCount) {
      return b.finishedCount - a.finishedCount; // More finished members first
    }
    return a.teamName.localeCompare(b.teamName);
  });

  const headers = [
    'Xếp Hạng Đội',
    'Tên Đội',
    'Thời Gian Trung Bình Đội',
    'Tổng Thời Gian Đội',
    'Trạng Thái',
    'Số VĐV Hoàn Thành',
    'Thành Viên 1 - Tên',
    'Thành Viên 1 - BIB',
    'Thành Viên 1 - Thời Gian',
    'Thành Viên 2 - Tên',
    'Thành Viên 2 - BIB',
    'Thành Viên 2 - Thời Gian',
    'Thành Viên 3 - Tên',
    'Thành Viên 3 - BIB',
    'Thành Viên 3 - Thời Gian',
  ];

  const rows = sorted.map((team, idx) => {
    const rank = team.finishedCount === 3 ? idx + 1 : '-';
    const statusText = team.finishedCount === 3 ? 'Hoàn thành' : `${team.finishedCount}/3 thành viên`;
    const m1 = team.members[0];
    const m2 = team.members[1];
    const m3 = team.members[2];

    return [
      escapeCSV(rank),
      escapeCSV(team.teamName),
      escapeCSV(team.finishedCount === 3 ? formatElapsed(team.averageElapsedMs) : 'Chưa đủ 3 VĐV'),
      escapeCSV(team.finishedCount === 3 ? formatElapsed(team.totalElapsedMs) : '-'),
      escapeCSV(statusText),
      escapeCSV(`${team.finishedCount}/3`),
      escapeCSV(m1?.name || ''),
      escapeCSV(m1?.bib || ''),
      escapeCSV(formatElapsed(m1?.elapsedMs)),
      escapeCSV(m2?.name || ''),
      escapeCSV(m2?.bib || ''),
      escapeCSV(formatElapsed(m2?.elapsedMs)),
      escapeCSV(m3?.name || ''),
      escapeCSV(m3?.bib || ''),
      escapeCSV(formatElapsed(m3?.elapsedMs)),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const sanitizedRace = raceName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  triggerDownload(csvContent, `Ket_qua_Dong_doi_${sanitizedRace}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportAllResultsCSV(runners: IndividualRunner[], teams: Team[], raceName: string) {
  // Export both as sectioned file
  let full = `--- KẾT QUẢ BẢNG CÁ NHÂN (${runners.length} VẬN ĐỘNG VIÊN) ---\r\n`;
  const indHeaders = ['Xếp Hạng', 'Số BIB', 'Họ Và Tên', 'Giới Tính', 'Trạng Thái', 'Thời Gian', 'Giờ Xuất Phát', 'Giờ Về Đích'];
  full += indHeaders.join(',') + '\r\n';

  const sortedInd = [...runners].sort((a, b) => {
    if (a.status === 'finished' && b.status === 'finished') return (a.elapsedMs || 0) - (b.elapsedMs || 0);
    if (a.status === 'finished') return -1;
    if (b.status === 'finished') return 1;
    return a.bib.localeCompare(b.bib);
  });

  sortedInd.forEach((r, idx) => {
    const rank = r.status === 'finished' ? idx + 1 : '-';
    full += [
      escapeCSV(rank),
      escapeCSV(r.bib),
      escapeCSV(r.name),
      escapeCSV(r.gender || ''),
      escapeCSV(r.status === 'finished' ? 'Đã về đích' : r.status),
      escapeCSV(formatElapsed(r.elapsedMs)),
      escapeCSV(formatTimeOfDay(r.startTime)),
      escapeCSV(formatTimeOfDay(r.finishTime)),
    ].join(',') + '\r\n';
  });

  full += `\r\n--- KẾT QUẢ BẢNG ĐỒNG ĐỘI (3 NGƯỜI/ĐỘI - ${teams.length} ĐỘI) ---\r\n`;
  const teamHeaders = [
    'Xếp Hạng', 'Tên Đội', 'Thời Gian Trung Bình', 'Tổng Thời Gian', 'Số Người Đã Về',
    'VĐV 1 Tên', 'VĐV 1 BIB', 'VĐV 1 Time',
    'VĐV 2 Tên', 'VĐV 2 BIB', 'VĐV 2 Time',
    'VĐV 3 Tên', 'VĐV 3 BIB', 'VĐV 3 Time'
  ];
  full += teamHeaders.join(',') + '\r\n';

  const sortedTeams = [...teams].sort((a, b) => {
    if (a.finishedCount === 3 && b.finishedCount === 3) return (a.averageElapsedMs || 0) - (b.averageElapsedMs || 0);
    if (a.finishedCount !== b.finishedCount) return b.finishedCount - a.finishedCount;
    return a.teamName.localeCompare(b.teamName);
  });

  sortedTeams.forEach((t, idx) => {
    const rank = t.finishedCount === 3 ? idx + 1 : '-';
    full += [
      escapeCSV(rank),
      escapeCSV(t.teamName),
      escapeCSV(t.finishedCount === 3 ? formatElapsed(t.averageElapsedMs) : 'Chưa xong'),
      escapeCSV(t.finishedCount === 3 ? formatElapsed(t.totalElapsedMs) : '-'),
      escapeCSV(`${t.finishedCount}/3`),
      escapeCSV(t.members[0]?.name || ''), escapeCSV(t.members[0]?.bib || ''), escapeCSV(formatElapsed(t.members[0]?.elapsedMs)),
      escapeCSV(t.members[1]?.name || ''), escapeCSV(t.members[1]?.bib || ''), escapeCSV(formatElapsed(t.members[1]?.elapsedMs)),
      escapeCSV(t.members[2]?.name || ''), escapeCSV(t.members[2]?.bib || ''), escapeCSV(formatElapsed(t.members[2]?.elapsedMs)),
    ].join(',') + '\r\n';
  });

  const sanitizedRace = raceName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  triggerDownload(full, `Ket_qua_Toan_bo_${sanitizedRace}_${new Date().toISOString().slice(0, 10)}.csv`);
}
