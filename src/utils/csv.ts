import { IndividualRunner, Team } from '@/types/race';
import { formatElapsed, formatTimeOfDay } from './time';
import * as XLSX from 'xlsx';

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
  // \uFEFF is UTF-8 BOM to display Vietnamese accents in Excel
  // "sep=,\r\n" is an official Microsoft Excel directive that instructs Excel to use comma as delimiter
  const fullContent = '\uFEFFsep=,\r\n' + content;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSanitizedName(raceName: string): string {
  return raceName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
}

// -------------------------------------------------------------
// INDIVIDUAL HELPERS & EXPORTS
// -------------------------------------------------------------

function getSortedIndividuals(runners: IndividualRunner[]) {
  return [...runners].sort((a, b) => {
    if (a.status === 'finished' && b.status === 'finished') {
      const diff = (a.adjustedElapsedMs || 0) - (b.adjustedElapsedMs || 0);
      if (diff !== 0) return diff;
      return (a.elapsedMs || 0) - (b.elapsedMs || 0);
    }
    if (a.status === 'finished') return -1;
    if (b.status === 'finished') return 1;
    return a.bib.localeCompare(b.bib);
  });
}

const INDIVIDUAL_HEADERS = [
  'Xếp Hạng',
  'Số BIB',
  'Họ Và Tên',
  'Công Ty',
  'Slogan',
  'Giới Tính',
  'Trạng Thái',
  'Thời Gian Xếp Hạng (Nữ -15%)',
  'Thời Gian Chạy Thực Tế',
  'Chính Sách Ưu Tiên',
  'Giờ Xuất Phát',
  'Giờ Về Đích'
];

function getIndividualRowData(r: IndividualRunner, rankNumber: number | string) {
  const statusText = 
    r.status === 'finished' ? 'Đã về đích' :
    r.status === 'running' ? 'Đang chạy' :
    r.status === 'dnf' ? 'Không hoàn thành (DNF)' : 'Chưa xuất phát';

  const policyText = r.gender === 'Nữ' ? 'Nữ ưu tiên 15% (× 0.85)' : 'Không ưu tiên';

  return [
    rankNumber,
    r.bib,
    r.name,
    r.company || '',
    r.slogan || '',
    r.gender || 'Nam',
    statusText,
    formatElapsed(r.adjustedElapsedMs || r.elapsedMs),
    formatElapsed(r.elapsedMs),
    policyText,
    formatTimeOfDay(r.startTime),
    formatTimeOfDay(r.finishTime),
  ];
}

export function exportIndividualCSV(runners: IndividualRunner[], raceName: string) {
  const sorted = getSortedIndividuals(runners);
  const rows = sorted.map((r, idx) => {
    const rank = r.status === 'finished' ? idx + 1 : '-';
    return getIndividualRowData(r, rank).map(escapeCSV).join(',');
  });

  const csvContent = [INDIVIDUAL_HEADERS.join(','), ...rows].join('\r\n');
  triggerDownload(csvContent, `Ket_qua_Ca_nhan_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportIndividualExcel(runners: IndividualRunner[], raceName: string) {
  const sorted = getSortedIndividuals(runners);
  const data = [
    INDIVIDUAL_HEADERS,
    ...sorted.map((r, idx) => {
      const rank = r.status === 'finished' ? idx + 1 : '-';
      return getIndividualRowData(r, rank);
    })
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 24 }, { wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 18 },
    { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng Cá Nhân');
  XLSX.writeFile(wb, `Ket_qua_Ca_nhan_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// -------------------------------------------------------------
// TEAM HELPERS & EXPORTS
// -------------------------------------------------------------

function getSortedTeams(teams: Team[]) {
  return [...teams].sort((a, b) => {
    if (a.finishedCount === 3 && b.finishedCount === 3) {
      const diff = (a.totalElapsedMs || 0) - (b.totalElapsedMs || 0);
      if (diff !== 0) return diff;
      return (a.bestMemberElapsedMs || 0) - (b.bestMemberElapsedMs || 0);
    }
    if (a.finishedCount !== b.finishedCount) {
      return b.finishedCount - a.finishedCount;
    }
    return a.teamName.localeCompare(b.teamName);
  });
}

const TEAM_HEADERS = [
  'Xếp Hạng Đội',
  'Tên Đội',
  'Slogan Đội',
  'Tổng Thời Gian Đội (3 VĐV)',
  'Thành Viên Về Nhanh Nhất',
  'Trạng Thái',
  'Số VĐV Hoàn Thành',
  'Thành Viên 1 - Tên',
  'Thành Viên 1 - Chức Vụ',
  'Thành Viên 1 - BIB',
  'Thành Viên 1 - Thời Gian',
  'Thành Viên 2 - Tên',
  'Thành Viên 2 - Chức Vụ',
  'Thành Viên 2 - BIB',
  'Thành Viên 2 - Thời Gian',
  'Thành Viên 3 - Tên',
  'Thành Viên 3 - Chức Vụ',
  'Thành Viên 3 - BIB',
  'Thành Viên 3 - Thời Gian',
];

function getTeamRowData(team: Team, rankNumber: number | string) {
  const statusText = team.finishedCount === 3 ? 'Hoàn thành' : `${team.finishedCount}/3 thành viên`;
  const m1 = team.members[0];
  const m2 = team.members[1];
  const m3 = team.members[2];

  return [
    rankNumber,
    team.teamName,
    team.slogan || '',
    team.finishedCount === 3 ? formatElapsed(team.totalElapsedMs) : 'Chưa đủ 3 VĐV',
    team.finishedCount === 3 ? formatElapsed(team.bestMemberElapsedMs) : '-',
    statusText,
    `${team.finishedCount}/3`,
    m1?.name || '',
    m1?.roleInTeam || '',
    m1?.bib || '',
    formatElapsed(m1?.elapsedMs),
    m2?.name || '',
    m2?.roleInTeam || '',
    m2?.bib || '',
    formatElapsed(m2?.elapsedMs),
    m3?.name || '',
    m3?.roleInTeam || '',
    m3?.bib || '',
    formatElapsed(m3?.elapsedMs),
  ];
}

export function exportTeamCSV(teams: Team[], raceName: string) {
  const sorted = getSortedTeams(teams);
  const rows = sorted.map((team, idx) => {
    const rank = team.finishedCount === 3 ? idx + 1 : '-';
    return getTeamRowData(team, rank).map(escapeCSV).join(',');
  });

  const csvContent = [TEAM_HEADERS.join(','), ...rows].join('\r\n');
  triggerDownload(csvContent, `Ket_qua_Dong_doi_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportTeamExcel(teams: Team[], raceName: string) {
  const sorted = getSortedTeams(teams);
  const data = [
    TEAM_HEADERS,
    ...sorted.map((team, idx) => {
      const rank = team.finishedCount === 3 ? idx + 1 : '-';
      return getTeamRowData(team, rank);
    })
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 16 }, { wch: 18 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng Đồng Đội');
  XLSX.writeFile(wb, `Ket_qua_Dong_doi_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// -------------------------------------------------------------
// COMBINED ALL RESULTS EXPORTS
// -------------------------------------------------------------

export function exportAllResultsCSV(runners: IndividualRunner[], teams: Team[], raceName: string) {
  const sortedInd = getSortedIndividuals(runners);
  const sortedTeams = getSortedTeams(teams);

  let full = INDIVIDUAL_HEADERS.join(',') + '\r\n';
  sortedInd.forEach((r, idx) => {
    const rank = r.status === 'finished' ? idx + 1 : '-';
    full += getIndividualRowData(r, rank).map(escapeCSV).join(',') + '\r\n';
  });

  full += '\r\n' + TEAM_HEADERS.join(',') + '\r\n';
  sortedTeams.forEach((t, idx) => {
    const rank = t.finishedCount === 3 ? idx + 1 : '-';
    full += getTeamRowData(t, rank).map(escapeCSV).join(',') + '\r\n';
  });

  triggerDownload(full, `Ket_qua_Toan_bo_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportAllResultsExcel(runners: IndividualRunner[], teams: Team[], raceName: string) {
  const sortedInd = getSortedIndividuals(runners);
  const sortedTeams = getSortedTeams(teams);

  const indData = [
    INDIVIDUAL_HEADERS,
    ...sortedInd.map((r, idx) => {
      const rank = r.status === 'finished' ? idx + 1 : '-';
      return getIndividualRowData(r, rank);
    })
  ];

  const teamData = [
    TEAM_HEADERS,
    ...sortedTeams.map((t, idx) => {
      const rank = t.finishedCount === 3 ? idx + 1 : '-';
      return getTeamRowData(t, rank);
    })
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Cá Nhân
  const wsInd = XLSX.utils.aoa_to_sheet(indData);
  wsInd['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 24 }, { wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 18 },
    { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInd, 'Bảng Cá Nhân');

  // Sheet 2: Đồng Đội
  const wsTeam = XLSX.utils.aoa_to_sheet(teamData);
  wsTeam['!cols'] = [
    { wch: 14 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 16 }, { wch: 18 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Bảng Đồng Đội');

  XLSX.writeFile(wb, `Ket_qua_Toan_bo_${getSanitizedName(raceName)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
