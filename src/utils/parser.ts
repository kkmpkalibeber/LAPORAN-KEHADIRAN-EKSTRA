import { StudentAttendance, CalculationFormula } from '../types';

/**
 * Normalizes an attendance string to 'H', 'S', 'I', 'A', or '-'
 */
export function normalizeAttendance(val: string | undefined | null): string {
  if (!val) return '-';
  const clean = val.toString().trim().toUpperCase();
  if (clean === 'H' || clean === 'HADIR') return 'H';
  if (clean === 'S' || clean === 'SAKIT') return 'S';
  if (clean === 'I' || clean === 'IZIN') return 'I';
  if (clean === 'A' || clean === 'ALFA' || clean === 'ALPHA' || clean === 'ABSENT') return 'A';
  if (clean === '-' || clean === 'N/A' || clean === '') return '-';
  return clean; // Fallback to what was typed if custom
}

/**
 * Formats an Excel date serial number to DD/MM/YYYY string.
 * If not a serial number, returns the string representation.
 */
function formatExcelDate(cell: any): string {
  if (cell === null || cell === undefined) return '';
  const num = Number(cell);
  if (typeof cell === 'number' && !isNaN(num) && num > 30000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + tzOffset);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return cell.toString().trim();
}

/**
 * Parses a 2D array of strings (from Excel or TSV paste) into students list and dates list.
 */
export function parseAttendanceData(rawRows: (string | number | null | undefined)[][]): {
  students: StudentAttendance[];
  dates: string[];
  error?: string;
} {
  if (rawRows.length === 0) {
    return { students: [], dates: [], error: 'Data kosong' };
  }

  // Find header row: the row containing "Nama" or "Name" (or the first row)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    const containsName = row.some(cell => 
      cell !== null && cell !== undefined && 
      (cell.toString().toLowerCase().includes('nama') || cell.toString().toLowerCase().includes('name'))
    );
    if (containsName) {
      headerRowIndex = i;
      break;
    }
  }

  const seenHeaders = new Map<string, number>();
  const headers = rawRows[headerRowIndex].map((cell, idx) => {
    let val = formatExcelDate(cell);
    if (!val) {
      val = `Kolom ${idx + 1}`;
    }
    
    if (!seenHeaders.has(val)) {
      seenHeaders.set(val, 1);
      return val;
    } else {
      const count = seenHeaders.get(val)! + 1;
      seenHeaders.set(val, count);
      return `${val} (${count})`;
    }
  });

  // Identify column indices
  let noIndex = -1;
  let namaIndex = -1;
  let kelasIndex = -1;
  let ekstraIndex = -1;

  headers.forEach((header, idx) => {
    const lower = header.toLowerCase();
    if (lower === 'no' || lower === 'no.' || lower === 'nomer') {
      if (noIndex === -1) noIndex = idx;
    } else if (lower.includes('nama') || lower === 'name' || lower === 'siswa') {
      if (namaIndex === -1) namaIndex = idx;
    } else if (lower.includes('kelas') || lower === 'class' || lower === 'kls') {
      if (kelasIndex === -1) kelasIndex = idx;
    } else if (lower.includes('ekstra') || lower.includes('eskul') || lower.includes('kegiatan') || lower === 'club') {
      if (ekstraIndex === -1) ekstraIndex = idx;
    }
  });

  // Fallbacks if columns not strictly matching names
  if (namaIndex === -1) {
    // Guess the first column that has mostly text, or default to column index 1
    namaIndex = headers.length > 1 ? 1 : 0;
  }
  if (kelasIndex === -1) {
    // If not found, look for something with X, XI, XII, or class indicators or default to index 2
    kelasIndex = headers.length > 2 ? 2 : -1;
  }
  if (ekstraIndex === -1) {
    ekstraIndex = headers.length > 3 ? 3 : -1;
  }
  if (noIndex === -1) {
    noIndex = headers.length > 0 && headers[0].toLowerCase() === 'no' ? 0 : -1;
  }

  // Identify date/meeting columns
  // Standard non-date columns indices
  const metaIndices = [noIndex, namaIndex, kelasIndex, ekstraIndex].filter(idx => idx !== -1);
  
  const dateColumns: { index: number; label: string }[] = [];
  headers.forEach((header, idx) => {
    if (!metaIndices.includes(idx)) {
      const lowerHeader = header.toLowerCase().trim();
      const isSummary = 
        lowerHeader === 'h' || lowerHeader === 's' || lowerHeader === 'i' || lowerHeader === 'a' ||
        lowerHeader.startsWith('h (') || lowerHeader.startsWith('s (') || lowerHeader.startsWith('i (') || lowerHeader.startsWith('a (') ||
        lowerHeader.startsWith('h(') || lowerHeader.startsWith('s(') || lowerHeader.startsWith('i(') || lowerHeader.startsWith('a(') ||
        lowerHeader.includes('hadir') || lowerHeader.includes('sakit') || lowerHeader.includes('izin') || 
        lowerHeader.includes('alfa') || lowerHeader.includes('alpha') || lowerHeader.includes('absen') ||
        lowerHeader.includes('prosentase') || lowerHeader.includes('persentase') || lowerHeader.includes('percentage') || 
        lowerHeader.includes('%') || lowerHeader.includes('keterangan') || lowerHeader.includes('status') ||
        lowerHeader.includes('total') || lowerHeader.includes('rekap') || lowerHeader.includes('summary');

      if (!isSummary) {
        dateColumns.push({ index: idx, label: header });
      }
    }
  });

  const dates = dateColumns.map(col => col.label);

  const students: StudentAttendance[] = [];
  let noCounter = 1;

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Check if the row has any data or is mostly empty
    const hasData = row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '');
    if (!hasData) continue;

    const rawNama = namaIndex !== -1 && row[namaIndex] !== undefined && row[namaIndex] !== null 
      ? row[namaIndex]!.toString().trim() 
      : '';
      
    // If name is empty, skip or generate a placeholder
    if (!rawNama) continue;

    const noVal = noIndex !== -1 && row[noIndex] !== undefined && row[noIndex] !== null
      ? parseInt(row[noIndex]!.toString().trim())
      : noCounter++;

    const kelasVal = kelasIndex !== -1 && row[kelasIndex] !== undefined && row[kelasIndex] !== null
      ? row[kelasIndex]!.toString().trim()
      : '-';

    const ekstraVal = ekstraIndex !== -1 && row[ekstraIndex] !== undefined && row[ekstraIndex] !== null
      ? row[ekstraIndex]!.toString().trim()
      : '-';

    const attendanceMap: { [date: string]: string } = {};
    dateColumns.forEach(col => {
      const cellVal = row[col.index] !== undefined && row[col.index] !== null
        ? row[col.index]!.toString().trim()
        : '-';
      attendanceMap[col.label] = normalizeAttendance(cellVal);
    });

    students.push({
      id: `student-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      no: isNaN(noVal) ? noCounter++ : noVal,
      nama: rawNama,
      kelas: kelasVal,
      ekstra: ekstraVal,
      attendance: attendanceMap
    });
  }

  return { students, dates };
}

/**
 * Parses TSV string (from clipboard copy-paste from Excel)
 */
export function parseTSV(text: string): {
  students: StudentAttendance[];
  dates: string[];
  error?: string;
} {
  const lines = text.split(/\r?\n/);
  const rawRows = lines
    .map(line => line.split('\t'))
    .filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
  
  return parseAttendanceData(rawRows);
}

/**
 * Calculates the maximum meetings (total H + S + I + A) for each extracurricular activity (ekstra)
 */
export function calculateEkstraMaxMeetings(
  students: StudentAttendance[],
  dates: string[]
): Record<string, number> {
  const maxMeetings: Record<string, number> = {};

  students.forEach(student => {
    const ekstra = student.ekstra || '-';
    let hCount = 0;
    let sCount = 0;
    let iCount = 0;
    let aCount = 0;

    dates.forEach(date => {
      const status = student.attendance[date] || '-';
      if (status === 'H') hCount++;
      else if (status === 'S') sCount++;
      else if (status === 'I') iCount++;
      else if (status === 'A') aCount++;
    });

    const studentTotal = hCount + sCount + iCount + aCount;
    if (maxMeetings[ekstra] === undefined || studentTotal > maxMeetings[ekstra]) {
      maxMeetings[ekstra] = studentTotal;
    }
  });

  return maxMeetings;
}

/**
 * Calculates attendance counts and percentages for a student
 */
export function calculateStudentSummary(
  student: StudentAttendance,
  dates: string[],
  formula: CalculationFormula,
  maxMeetingsOfEkstra?: number
): {
  hCount: number;
  sCount: number;
  iCount: number;
  aCount: number;
  percentage: number;
  totalActive: number;
} {
  let hCount = 0;
  let sCount = 0;
  let iCount = 0;
  let aCount = 0;

  dates.forEach(date => {
    const status = student.attendance[date] || '-';
    if (status === 'H') hCount++;
    else if (status === 'S') sCount++;
    else if (status === 'I') iCount++;
    else if (status === 'A') aCount++;
  });

  let percentage = 100;
  let totalActive = 0;

  // Use maximum meetings for extracurricular if specified, otherwise default to this student's active count or total dates
  const referenceMeetings = maxMeetingsOfEkstra !== undefined ? maxMeetingsOfEkstra : (hCount + sCount + iCount + aCount);

  switch (formula) {
    case 'ALL_STATUS':
      // H / MaxMeetingsOfEkstra
      totalActive = referenceMeetings;
      percentage = totalActive > 0 ? (hCount / totalActive) * 100 : 100;
      break;
    case 'EXCLUDE_SI':
      // H / (MaxMeetingsOfEkstra - S - I)
      totalActive = referenceMeetings - sCount - iCount;
      percentage = totalActive > 0 ? (hCount / totalActive) * 100 : 100;
      break;
    case 'EXCUSED_PRESENT':
      // (H + S + I) / MaxMeetingsOfEkstra
      totalActive = referenceMeetings;
      percentage = totalActive > 0 ? ((hCount + sCount + iCount) / totalActive) * 100 : 100;
      break;
  }

  return {
    hCount,
    sCount,
    iCount,
    aCount,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
    totalActive
  };
}
