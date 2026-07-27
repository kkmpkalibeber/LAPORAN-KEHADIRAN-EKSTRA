export interface StudentAttendance {
  id: string; // Unique ID
  no: number;
  nama: string;
  kelas: string;
  ekstra: string;
  attendance: { [date: string]: string }; // Map of Date -> 'H' | 'S' | 'I' | 'A' | '-' | ''
}

export interface AttendanceSummary {
  hCount: number;
  sCount: number;
  iCount: number;
  aCount: number;
  percentage: number;
  totalActive: number;
}

export type CalculationFormula = 
  | 'ALL_STATUS' // H / (H + S + I + A)
  | 'EXCLUDE_SI' // H / (H + A)
  | 'EXCUSED_PRESENT'; // (H + S + I) / (H + S + I + A)
