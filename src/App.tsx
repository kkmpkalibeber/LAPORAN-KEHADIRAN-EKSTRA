import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Clipboard, Calendar, HelpCircle, Users, 
  Sparkles, RefreshCw, Layers, GraduationCap, CheckCircle,
  AlertCircle, Trash2, X, Lock, Key, ShieldCheck, Eye, LogOut,
  CloudCheck, Cloud
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, ATTENDANCE_DOC_ID } from './lib/firebase';
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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Admin & Viewer Mode State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('eskul_attendance_is_admin') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [adminPin] = useState<string>('1234');

  // Real-time Firebase Firestore Sync Listener
  useEffect(() => {
    const docRef = doc(db, 'attendance_data', ATTENDANCE_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
        }
        if (data.dates && Array.isArray(data.dates)) {
          setDates(data.dates);
        }
        if (data.formula) {
          setFormula(data.formula as CalculationFormula);
        }
        if (typeof data.minAttendance === 'number') {
          setMinAttendance(data.minAttendance);
        }
        setIsCloudSynced(true);
      } else {
        // First visit or initial cloud document creation: Seed Firestore with initial sample data
        const initStudents = SAMPLE_STUDENTS;
        const initDates = SAMPLE_DATES;
        setDoc(docRef, {
          students: initStudents,
          dates: initDates,
          formula: 'ALL_STATUS',
          minAttendance: 75,
          userCleared: false,
          updatedAt: new Date().toISOString()
        }).then(() => {
          setIsCloudSynced(true);
        }).catch(err => {
          console.error('Error initializing Firestore:', err);
        });
      }
    }, (error) => {
      console.error('Firestore snapshot listener error:', error);
      setIsCloudSynced(false);
    });

    return () => unsubscribe();
  }, []);

  // Save to LocalStorage as offline fallback
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

  // Helper to push updates directly to Firebase Cloud Firestore
  const updateFirestoreData = async (
    newStudents: StudentAttendance[],
    newDates: string[],
    newFormula: CalculationFormula,
    newMinAttendance: number,
    userCleared = false
  ) => {
    try {
      setIsSyncing(true);
      const docRef = doc(db, 'attendance_data', ATTENDANCE_DOC_ID);
      await setDoc(docRef, {
        students: newStudents,
        dates: newDates,
        formula: newFormula,
        minAttendance: newMinAttendance,
        userCleared,
        updatedAt: new Date().toISOString()
      });
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Failed to update Cloud Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDataLoaded = (newStudents: StudentAttendance[], newDates: string[]) => {
    localStorage.removeItem('eskul_attendance_user_cleared');
    setStudents(newStudents);
    setDates(newDates);
    updateFirestoreData(newStudents, newDates, formula, minAttendance, false);
  };

  const handleLoadSample = () => {
    localStorage.removeItem('eskul_attendance_user_cleared');
    setStudents(SAMPLE_STUDENTS);
    setDates(SAMPLE_DATES);
    updateFirestoreData(SAMPLE_STUDENTS, SAMPLE_DATES, formula, minAttendance, false);
  };

  const handleClearAll = () => {
    setShowResetModal(true);
  };

  const confirmResetAll = () => {
    setStudents([]);
    setDates([]);
    localStorage.removeItem('eskul_attendance_students');
    localStorage.removeItem('eskul_attendance_dates');
    localStorage.setItem('eskul_attendance_user_cleared', 'true');
    setShowResetModal(false);
    updateFirestoreData([], [], formula, minAttendance, true);
  };

  const handleFormulaChange = (newFormula: CalculationFormula) => {
    setFormula(newFormula);
    updateFirestoreData(students, dates, newFormula, minAttendance, false);
  };

  const handleMinAttendanceChange = (newMin: number) => {
    setMinAttendance(newMin);
    updateFirestoreData(students, dates, formula, newMin, false);
  };

  const handleLoginAdmin = () => {
    if (adminPinInput === adminPin) {
      setIsAdmin(true);
      localStorage.setItem('eskul_attendance_is_admin', 'true');
      setShowAdminModal(false);
      setAdminPinInput('');
      setPinError('');
    } else {
      setPinError('PIN Admin salah. Coba PIN default: 1234');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    localStorage.setItem('eskul_attendance_is_admin', 'false');
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">
                  SIAKAD Ekstra v2.4
                </span>
                <span className="text-slate-300 dark:text-slate-800">•</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200/60 dark:border-emerald-900/40">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Firebase Firestore Active</span>
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 font-sans tracking-tight mt-1">
                Kalkulator Kehadiran Ekstrakurikuler
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hitung rekap H, S, I, A & prosentase otomatis. Data tersimpan permanen di Cloud Database!
              </p>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mode Admin (Akses Penuh)</span>
                </span>
                <button
                  onClick={handleLogoutAdmin}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  id="btn-logout-admin"
                  title="Keluar ke Mode Pembaca (Read-Only)"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Admin</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mode Pembaca (Read-Only)</span>
                </span>
                <button
                  onClick={() => {
                    setShowAdminModal(true);
                    setPinError('');
                    setAdminPinInput('');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  id="btn-open-admin-modal"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Masuk Admin</span>
                </button>
              </div>
            )}

            {isAdmin && students.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-500 bg-rose-50 hover:bg-rose-100/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-100 dark:border-rose-950 rounded-lg transition-colors cursor-pointer"
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

            {/* Uploader panel - ONLY FOR ADMIN */}
            {isAdmin ? (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Langkah 1: Masukkan Data Absensi Siswa (Mode Admin)</span>
                </h3>
                <ExcelUploader 
                  onDataLoaded={handleDataLoaded} 
                  onLoadSample={handleLoadSample} 
                />
              </div>
            ) : (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Mode Pembaca (Read-Only)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Belum ada data absensi yang dimuat oleh Admin. Pengunjung umum hanya berkesempatan membaca & mengunduh data rekapitulasi setelah diunggah oleh Admin.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowAdminModal(true);
                      setPinError('');
                      setAdminPinInput('');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>Masuk Mode Admin untuk Unggah File</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pasting Instructions Guide - ONLY FOR ADMIN */}
            {isAdmin && (
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
            )}

          </div>
        ) : (
          /* ACTIVE DATABASE STATE */
          <div className="space-y-8 animate-fade-in" id="active-state-view">
            
            {/* Quick Helper Banner */}
            <div className="p-3 bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/10 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                {isAdmin ? (
                  <span><strong>Mode Admin:</strong> Anda memiliki wewenang penuh untuk mengubah status kehadiran, mengatur rumus, dan mengunggah berkas baru.</span>
                ) : (
                  <span><strong>Mode Pembaca:</strong> Anda dapat melihat data absensi, mencari siswa/kelas/ekstra, menyaring data, dan mengunduh laporan PDF/Excel.</span>
                )}
              </div>
              {isAdmin && (
                <button 
                  onClick={handleLoadSample}
                  className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer shrink-0"
                >
                  Ganti ke Data Contoh
                </button>
              )}
            </div>

            {/* Calculations config */}
            <FormulaGuide 
              formula={formula} 
              setFormula={handleFormulaChange} 
              minAttendance={minAttendance}
              setMinAttendance={handleMinAttendanceChange}
              isAdmin={isAdmin}
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
                setStudents={(action) => {
                  const nextStudents = typeof action === 'function' ? action(students) : action;
                  setStudents(nextStudents);
                  updateFirestoreData(nextStudents, dates, formula, minAttendance, false);
                }}
                setDates={(action) => {
                  const nextDates = typeof action === 'function' ? action(dates) : action;
                  setDates(nextDates);
                  updateFirestoreData(students, nextDates, formula, minAttendance, false);
                }}
                minAttendance={minAttendance}
                onResetAll={handleClearAll}
                isAdmin={isAdmin}
              />
            </div>

          </div>
        )}

        {/* Modal Admin Login */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="admin-login-modal">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative">
              <button
                onClick={() => setShowAdminModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Masuk Mode Admin</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Akses fitur unggah & pengeditan data</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIN Admin:
                  </label>
                  <input
                    type="password"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLoginAdmin();
                    }}
                    placeholder="Masukkan PIN (Default: 1234)"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-mono tracking-widest"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{pinError}</p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>PIN Default Admin: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">1234</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleLoginAdmin}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-md shadow-indigo-200 dark:shadow-none"
                >
                  Masuk Admin
                </button>
              </div>
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
