import React from 'react';
import { Users, Calendar, Award, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { StudentAttendance, CalculationFormula } from '../types';
import { calculateStudentSummary, calculateEkstraMaxMeetings } from '../utils/parser';

interface StatsDashboardProps {
  students: StudentAttendance[];
  dates: string[];
  formula: CalculationFormula;
}

export default function StatsDashboard({ students, dates, formula }: StatsDashboardProps) {
  if (students.length === 0) return null;

  const maxMeetingsMap = calculateEkstraMaxMeetings(students, dates);

  // Calculate global statistics
  const summaries = students.map(s => {
    const maxMeetingsOfEkstra = maxMeetingsMap[s.ekstra] || 0;
    return calculateStudentSummary(s, dates, formula, maxMeetingsOfEkstra);
  });
  
  const totalStudents = students.length;
  const totalMeetings = dates.length;
  
  const averagePercentage = summaries.reduce((sum, s) => sum + s.percentage, 0) / totalStudents;
  const roundedAverage = Math.round(averagePercentage * 10) / 10;

  // Aggregate H, S, I, A across all students
  let totalH = 0;
  let totalS = 0;
  let totalI = 0;
  let totalA = 0;

  summaries.forEach(s => {
    totalH += s.hCount;
    totalS += s.sCount;
    totalI += s.iCount;
    totalA += s.aCount;
  });

  const grandTotal = totalH + totalS + totalI + totalA;
  const hPercent = grandTotal > 0 ? Math.round((totalH / grandTotal) * 100) : 0;
  const sPercent = grandTotal > 0 ? Math.round((totalS / grandTotal) * 100) : 0;
  const iPercent = grandTotal > 0 ? Math.round((totalI / grandTotal) * 100) : 0;
  const aPercent = grandTotal > 0 ? Math.round((totalA / grandTotal) * 100) : 0;

  // Identify students with low attendance (< 80%)
  const lowAttendanceStudents = students
    .map((s, idx) => ({ student: s, summary: summaries[idx] }))
    .filter(item => item.summary.percentage < 80)
    .sort((a, b) => a.summary.percentage - b.summary.percentage);

  // Calculate attendance per meeting date
  const attendancePerDate = dates.map(date => {
    let present = 0;
    let sick = 0;
    let excused = 0;
    let alpha = 0;
    let na = 0;

    students.forEach(s => {
      const status = s.attendance[date] || '-';
      if (status === 'H') present++;
      else if (status === 'S') sick++;
      else if (status === 'I') excused++;
      else if (status === 'A') alpha++;
      else na++;
    });

    const activeCount = present + sick + excused + alpha;
    const rate = activeCount > 0 ? Math.round((present / activeCount) * 100) : 0;

    return {
      date,
      present,
      sick,
      excused,
      alpha,
      na,
      rate
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats-dashboard">
      
      {/* Metric 1: Total Students */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-students">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Siswa</p>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            {totalStudents} <span className="text-sm font-normal text-slate-500">orang</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Terdaftar di berbagai ekstra</p>
        </div>
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 2: Avg Attendance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-avg-attendance">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Rata-Rata Kehadiran</p>
          <h3 className={`text-3xl font-extrabold font-sans tracking-tight ${
            roundedAverage >= 80 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : roundedAverage >= 60 
              ? 'text-amber-500' 
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {roundedAverage}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Rata-rata persentase per siswa</p>
        </div>
        <div className={`p-4 rounded-xl border ${
          roundedAverage >= 80 
            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30' 
            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-100/50 dark:border-amber-900/30'
        }`}>
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 3: Total Meetings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-meetings">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Pertemuan</p>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            {totalMeetings} <span className="text-sm font-normal text-slate-500">kali</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Jumlah tanggal kegiatan</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 4: Low Attendance Warning */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-low-attendance-alert">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Kehadiran Rendah (&lt;80%)</p>
          <h3 className={`text-3xl font-extrabold font-sans tracking-tight ${
            lowAttendanceStudents.length > 0 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-indigo-600 dark:text-indigo-400'
          }`}>
            {lowAttendanceStudents.length} <span className="text-sm font-normal text-slate-500">siswa</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Butuh perhatian / konseling</p>
        </div>
        <div className={`p-4 rounded-xl border ${
          lowAttendanceStudents.length > 0 
            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30' 
            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30'
        }`}>
          {lowAttendanceStudents.length > 0 ? (
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          ) : (
            <CheckCircle className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Visual Aggregates (Percentage Distribution of H,S,I,A) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm md:col-span-2 flex flex-col justify-between" id="chart-attendance-distribution">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Distribusi Log Kehadiran Keseluruhan</h4>
          <div className="flex items-center gap-1.5 h-6 rounded-full overflow-hidden w-full bg-slate-100 dark:bg-slate-800 mb-4">
            {hPercent > 0 && (
              <div 
                style={{ width: `${hPercent}%` }} 
                className="bg-emerald-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
                title={`Hadir: ${totalH} (${hPercent}%)`}
              >
                {hPercent >= 8 && `${hPercent}%`}
              </div>
            )}
            {sPercent > 0 && (
              <div 
                style={{ width: `${sPercent}%` }} 
                className="bg-blue-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
                title={`Sakit: ${totalS} (${sPercent}%)`}
              >
                {sPercent >= 8 && `${sPercent}%`}
              </div>
            )}
            {iPercent > 0 && (
              <div 
                style={{ width: `${iPercent}%` }} 
                className="bg-amber-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
                title={`Izin: ${totalI} (${iPercent}%)`}
              >
                {iPercent >= 8 && `${iPercent}%`}
              </div>
            )}
            {aPercent > 0 && (
              <div 
                style={{ width: `${aPercent}%` }} 
                className="bg-rose-500 h-full transition-all flex items-center justify-center text-[10px] text-white font-bold"
                title={`Alpha: ${totalA} (${aPercent}%)`}
              >
                {aPercent >= 8 && `${aPercent}%`}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/10">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Hadir (H)</span>
            <span className="text-slate-500 font-mono font-medium">{totalH} ({hPercent}%)</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/10">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mb-1"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sakit (S)</span>
            <span className="text-slate-500 font-mono font-medium">{totalS} ({sPercent}%)</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/10">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mb-1"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Izin (I)</span>
            <span className="text-slate-500 font-mono font-medium">{totalI} ({iPercent}%)</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/10">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mb-1"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Alpha (A)</span>
            <span className="text-slate-500 font-mono font-medium">{totalA} ({aPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Alerts & Critical Follow-ups */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm md:col-span-2 flex flex-col" id="panel-low-attendance-list">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Siswa dengan Kehadiran Rendah (&lt;80%)</span>
        </h4>
        
        <div className="flex-1 max-h-[140px] overflow-y-auto pr-1">
          {lowAttendanceStudents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 py-6">
              Luar biasa! Tidak ada siswa dengan persentase kehadiran di bawah 80%.
            </div>
          ) : (
            <div className="space-y-2">
              {lowAttendanceStudents.slice(0, 5).map(({ student, summary }) => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.nama}</span>
                    <span className="text-slate-400 text-[10px]">{student.kelas} • {student.ekstra}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{summary.percentage}%</span>
                      <p className="text-[10px] text-slate-400">H: {summary.hCount} / S: {summary.sCount} / I: {summary.iCount} / A: {summary.aCount}</p>
                    </div>
                  </div>
                </div>
              ))}
              {lowAttendanceStudents.length > 5 && (
                <div className="text-center text-[10px] text-slate-400 mt-2">
                  dan {lowAttendanceStudents.length - 5} siswa lainnya di bawah batas aman.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
