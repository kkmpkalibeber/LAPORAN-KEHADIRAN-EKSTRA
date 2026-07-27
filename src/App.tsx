import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Clipboard, Calendar, HelpCircle, Users, 
  Sparkles, RefreshCw, Layers, GraduationCap, CheckCircle,
  AlertCircle, Trash2, X
} from 'lucide-react';
import ExcelUploader from './components/ExcelUploader';
import StatsDashboard from './components/StatsDashboard';
import AttendanceTable from './components/AttendanceTable';
import FormulaGuide from './components/FormulaGuide';
import { SAMPLE_STUDENTS, SAMPLE_DATES } from './data/sampleData';
import { StudentAttendance, CalculationFormula } from './types';

export default function App() {
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [formula, setFormula] = useState<CalculationFormula>('ALL_STATUS');
  const [minAttendance, setMinAttendance] = useState<number>(75);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('eskul_attendance_students');
    const savedDates = localStorage.getItem('eskul_attendance_dates');
    const savedFormula = localStorage.getItem('eskul_attendance_formula');
    const savedMinAttendance = localStorage.getItem('eskul_attendance_min_attendance');

    if (savedStudents && savedDates) {
      try {
        setStudents(JSON.parse(savedStudents));
        setDates(JSON.parse(savedDates));
      } catch (e) {
        console.error('Error loading saved attendance data:', e);
      }
    }
    if (savedFormula) {
      setFormula(savedFormula as CalculationFormula);
    }
    if (savedMinAttendance) {
      const parsedValue = parseInt(savedMinAttendance, 10);
      if (!isNaN(parsedValue)) {
        setMinAttendance(parsedValue);
      }
    }
  }, []);

  // Save to LocalStorage on state change
  useEffect(() => {
    if (students.length > 0 && dates.length > 0) {
      localStorage.setItem('eskul_attendance_students', JSON.stringify(students));
      localStorage.setItem('eskul_attendance_dates', JSON.stringify(dates));
    } else {
      localStorage.removeItem('eskul_attendance_students');
      localStorage.removeItem('eskul_attendance_dates');
    }
  }, [students, dates]);

  useEffect(() => {
    localStorage.setItem('eskul_attendance_formula', formula);
  }, [formula]);

  useEffect(() => {
    localStorage.setItem('eskul_attendance_min_attendance', minAttendance.toString());
  }, [minAttendance]);

  const handleDataLoaded = (newStudents: StudentAttendance[], newDates: string[]) => {
    setStudents(newStudents);
    setDates(newDates);
  };

  const handleLoadSample = () => {
    setStudents(SAMPLE_STUDENTS);
    setDates(SAMPLE_DATES);
  };

  const handleClearAll = () => {
    setShowResetModal(true);
  };

  const confirmResetAll = () => {
    setStudents([]);
    setDates([]);
    localStorage.removeItem('eskul_attendance_students');
    localStorage.removeItem('eskul_attendance_dates');
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Decorative top accent */}
      <div className="h-2 bg-indigo-600 w-full" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation / Header Title bar */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="app-header">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/15">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">
                  SIAKAD Ekstra v2.4
                </span>
                <span className="text-slate-300 dark:text-slate-800">•</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">100% Client-Side</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
                Kalkulator Kehadiran Ekstrakurikuler
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hitung rekap H, S, I, A & prosentase otomatis secara instan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {students.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-500 bg-rose-50 hover:bg-rose-100/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-100 dark:border-rose-950 rounded-lg transition-colors cursor-pointer"
                id="btn-header-clear-all"
              >
                Reset Semua Data
              </button>
            )}
          </div>
        </header>

        {students.length === 0 ? (
          /* EMPTY STATE / WELCOME SCREEN */
          <div className="space-y-8 max-w-4xl mx-auto" id="landing-page">
            
            {/* Visual Hero Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-100 dark:bg-indigo-950/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Sederhana, Cepat & Tanpa Registrasi</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-sans">
                  Olahlah Absensi Ekstrakurikuler Langsung dari Excel
                </h2>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aplikasi ini membantu Anda menghitung otomatis jumlah kehadiran (H), Sakit (S), Izin (I), dan Alpha (A) beserta persentase kehadiran setiap siswa secara dinamis. Cukup unggah berkas absensi Anda atau salin (copas) langsung dari sheet Excel/Google Sheets Anda!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Dukung upload .xlsx / .xls / .csv</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Salin tabel (Copas) dari Google Sheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Ubah data langsung (Interactive Grid)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Unduh hasil rekap kembali ke Excel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploader panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                Langkah 1: Masukkan Data Absensi Siswa
              </h3>
              <ExcelUploader 
                onDataLoaded={handleDataLoaded} 
                onLoadSample={handleLoadSample} 
              />
            </div>

            {/* Pasting Instructions Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5" id="how-to-guide">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Panduan Copy-Paste dari Excel</span>
              </h4>
              <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>Buka file absensi Anda di Microsoft Excel atau Google Sheets.</li>
                <li>Sorot/blok tabel absensi mulai dari baris header (yang berisi kolom <strong>No, Nama, Kelas, Ekstra, dan Tanggal-tanggal pertemuan</strong>) hingga baris siswa terakhir.</li>
                <li>Tekan tombol kombinasi <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">Ctrl + C</kbd> (Copy).</li>
                <li>Kembali ke halaman ini, tempelkan (<kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px]">Ctrl + V</kbd>) ke dalam kolom "Copas Tabel" di kanan atas.</li>
                <li>Klik tombol <strong>"Proses Data Copas"</strong>. Sistem akan langsung memformat data Anda!</li>
              </ol>
            </div>

          </div>
        ) : (
          /* ACTIVE DATABASE STATE */
          <div className="space-y-8 animate-fade-in" id="active-state-view">
            
            {/* Quick Helper Banner */}
            <div className="p-3 bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/10 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                <span><strong>Tips:</strong> Anda bisa mengeklik pilihan status <strong>(H/S/I/A/-)</strong> di dalam sel tabel kapan saja untuk merubah absensi secara langsung!</span>
              </div>
              <button 
                onClick={handleLoadSample}
                className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
              >
                Ganti ke Data Contoh
              </button>
            </div>

            {/* Calculations config */}
            <FormulaGuide 
              formula={formula} 
              setFormula={setFormula} 
              minAttendance={minAttendance}
              setMinAttendance={setMinAttendance}
            />

            {/* Statistics Widgets */}
            <StatsDashboard 
              students={students} 
              dates={dates} 
              formula={formula} 
            />

            {/* Main Interactive Table Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Daftar Absensi & Hasil Rekapitulasi Siswa
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Menampilkan {students.length} siswa terdaftar
                </span>
              </div>
              
              <AttendanceTable 
                students={students} 
                dates={dates} 
                formula={formula}
                setStudents={setStudents}
                setDates={setDates}
                minAttendance={minAttendance}
                onResetAll={handleClearAll}
              />
            </div>

          </div>
        )}

        {/* Modal Confirm Reset Data */}
        {showResetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="reset-confirm-modal">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
              <button
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Konfirmasi Reset Data</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kosongkan seluruh tabel kehadiran</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus seluruh data siswa dan catatan absensi saat ini? Data yang terhapus dari memori lokal tidak dapat dikembalikan.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  id="btn-modal-cancel-reset"
                >
                  Batal
                </button>
                <button
                  onClick={confirmResetAll}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-200 dark:shadow-none"
                  id="btn-modal-confirm-reset"
                >
                  Ya, Reset Semua Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500" id="app-footer">
          <p>© {new Date().getFullYear()} • SIAKAD Ekstrakurikuler • Dibangun untuk kemudahan administrasi absensi guru dan pelatih.</p>
        </footer>

      </div>
    </div>
  );
}
