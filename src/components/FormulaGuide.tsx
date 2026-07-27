import React from 'react';
import { HelpCircle, Sparkles, Minus, Plus, Settings2 } from 'lucide-react';
import { CalculationFormula } from '../types';

interface FormulaGuideProps {
  formula: CalculationFormula;
  setFormula: (formula: CalculationFormula) => void;
  minAttendance: number;
  setMinAttendance: (val: number) => void;
}

export default function FormulaGuide({ formula, setFormula, minAttendance, setMinAttendance }: FormulaGuideProps) {
  const options = [
    {
      id: 'ALL_STATUS' as CalculationFormula,
      title: 'H / (H + S + I + A)',
      description: 'Semua ketidakhadiran dihitung. Sakit (S), Izin (I), dan Alpha (A) semuanya mengurangi prosentase kehadiran.',
      example: 'Hadir 6, Sakit 1, Izin 1, Alpha 1 = 6/9 = 66.7%'
    },
    {
      id: 'EXCLUDE_SI' as CalculationFormula,
      title: 'H / (H + A)',
      description: 'Hanya Alpha (A) yang mengurangi prosentase. Sakit (S) dan Izin (I) diabaikan dari pembagi (dianggap dispensasi resmi).',
      example: 'Hadir 6, Sakit 1, Izin 1, Alpha 1 = 6/7 = 85.7%'
    },
    {
      id: 'EXCUSED_PRESENT' as CalculationFormula,
      title: '(H + S + I) / (H + S + I + A)',
      description: 'Sakit (S) dan Izin (I) dianggap "Hadir" atau termaafkan. Hanya Alpha (A) tanpa keterangan yang mengurangi prosentase.',
      example: 'Hadir 6, Sakit 1, Izin 1, Alpha 1 = 8/9 = 88.9%'
    }
  ];

  const handleDecrement = () => {
    if (minAttendance > 0) {
      setMinAttendance(Math.max(0, minAttendance - 5));
    }
  };

  const handleIncrement = () => {
    if (minAttendance < 100) {
      setMinAttendance(Math.min(100, minAttendance + 5));
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-8" id="formula-guide-panel">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" id="icon-formula-sparkle" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Rumus Perhitungan Prosentase Kehadiran</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {options.map((opt) => {
          const isActive = formula === opt.id;
          return (
            <div 
              key={opt.id}
              onClick={() => setFormula(opt.id)}
              className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isActive 
                  ? 'bg-indigo-500/10 border-indigo-500 dark:bg-indigo-950/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              id={`formula-option-${opt.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {opt.title}
                  </span>
                  {isActive && (
                    <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {opt.id === 'ALL_STATUS' ? 'Standar Sekolah' : opt.id === 'EXCLUDE_SI' ? 'Dispensasi Sakit/Izin' : 'Keterangan Termaafkan'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {opt.description}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-auto">
                <span className="font-semibold text-slate-500">Contoh:</span> {opt.example}
              </div>
            </div>
          );
        })}
      </div>

      {/* Batas Minimal Kehadiran Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="min-attendance-control">
        <div className="space-y-1 max-w-lg">
          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            Batas Minimal Persentase Kehadiran Cukup
          </h5>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Siswa yang memiliki persentase kehadiran <span className="font-semibold text-rose-600 dark:text-rose-400">di bawah {minAttendance}%</span> akan otomatis ditandai <span className="font-semibold text-rose-600 dark:text-rose-400">KURANG</span>. Sementara yang mencapai atau di atasnya ditandai <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-bold">AMAN</span>.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/30 px-3.5 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 self-start sm:self-center shrink-0">
          <button 
            type="button"
            onClick={handleDecrement}
            className="w-7 h-7 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs"
            title="Kurangi 5%"
          >
            <Minus className="w-3 h-3" />
          </button>

          <div className="flex flex-col items-center justify-center min-w-[70px]">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              value={minAttendance}
              onChange={(e) => setMinAttendance(parseInt(e.target.value) || 0)}
              className="w-20 accent-indigo-600 h-1 rounded-full cursor-pointer mb-1.5"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={minAttendance}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setMinAttendance(val);
                }}
                className="w-10 text-center font-bold font-mono text-sm bg-transparent border-b border-indigo-200 dark:border-indigo-800 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 p-0"
              />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">%</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleIncrement}
            className="w-7 h-7 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-xs"
            title="Tambah 5%"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
