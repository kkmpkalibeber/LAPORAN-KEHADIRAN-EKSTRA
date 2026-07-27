import React, { useState, useRef } from 'react';
import { Upload, Clipboard, Check, HelpCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseAttendanceData, parseTSV } from '../utils/parser';
import { StudentAttendance } from '../types';

interface ExcelUploaderProps {
  onDataLoaded: (students: StudentAttendance[], dates: string[]) => void;
  onLoadSample: () => void;
}

export default function ExcelUploader({ onDataLoaded, onLoadSample }: ExcelUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to 2D array of values
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawRows.length === 0) {
          setError('File excel kosong atau tidak terbaca.');
          return;
        }

        const { students, dates, error: parseError } = parseAttendanceData(rawRows);
        
        if (parseError) {
          setError(parseError);
        } else if (students.length === 0) {
          setError('Format kolom tidak sesuai. Pastikan ada kolom "Nama" atau "Name" dan beberapa kolom tanggal.');
        } else {
          onDataLoaded(students, dates);
        }
      } catch (err) {
        console.error(err);
        setError('Gagal membaca file Excel. Pastikan format file sesuai (.xlsx, .xls, atau .csv).');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    setError(null);
    if (!pasteText.trim()) {
      setError('Harap masukkan data tabel yang di-copy.');
      return;
    }

    try {
      const { students, dates, error: parseError } = parseTSV(pasteText);
      if (parseError) {
        setError(parseError);
      } else if (students.length === 0) {
        setError('Gagal memproses data. Pastikan Anda menyalin seluruh tabel dari Excel termasuk baris judul kolom (No, Nama, Kelas, dan Tanggal).');
      } else {
        setPasteSuccess(true);
        setTimeout(() => {
          onDataLoaded(students, dates);
          setPasteSuccess(false);
          setPasteText('');
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memproses data copas. Pastikan data berformat tabel dari Excel.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="uploader-section">
      {/* Excel Upload Area */}
      <div 
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        id="excel-drag-drop-zone"
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileChange}
          id="excel-file-input"
        />

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl mb-4 border border-indigo-100/50 dark:border-indigo-900/30">
          <FileSpreadsheet className="w-10 h-10" id="icon-spreadsheet" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 font-sans">
          Upload File Excel (.xlsx, .xls)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6 leading-relaxed">
          Drag dan drop file absensi Anda di sini, atau klik tombol di bawah untuk memilih file. Dukung format xlsx, xls, dan csv.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-md shadow-indigo-100/50 dark:shadow-none hover:shadow-lg transition-all flex items-center gap-2 text-sm cursor-pointer"
            id="btn-upload-file"
          >
            <Upload className="w-4 h-4" />
            Pilih File Excel
          </button>
          
          <button 
            onClick={onLoadSample}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all text-sm cursor-pointer"
            id="btn-load-sample"
          >
            Muat Data Contoh
          </button>
        </div>
      </div>

      {/* Copy-Paste Area */}
      <div className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
            <Clipboard className="w-5 h-5" id="icon-clipboard" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Copas (Paste) Tabel Excel / Google Sheets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cara tercepat! Seleksi tabel di Excel, copy (Ctrl+C), lalu paste di bawah.
            </p>
          </div>
        </div>

        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Tempelkan (Ctrl+V) tabel Anda di sini...&#10;Contoh format:&#10;No	Nama	Kelas	Ekstra	23/01	30/01&#10;1	QONITA	X-B	Bahasa Arab	-	H&#10;2	ARINA	X-C	Bahasa Arab	H	A"
          className="flex-1 w-full min-h-[140px] p-3 text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          id="textarea-tsv-paste"
        />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pastikan menyertakan baris judul kolom.</span>
          </div>

          <button
            onClick={handlePasteSubmit}
            disabled={pasteSuccess}
            className={`px-5 py-2.5 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              pasteSuccess 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none'
            }`}
            id="btn-process-pasted-text"
          >
            {pasteSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Berhasil Diimpor!
              </>
            ) : (
              <>
                Proses Data Copas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="lg:col-span-2 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 text-rose-700 dark:text-rose-400 rounded-xl text-sm leading-relaxed flex items-start gap-2 animate-fade-in" id="upload-error-message">
          <span className="font-bold">Error:</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
