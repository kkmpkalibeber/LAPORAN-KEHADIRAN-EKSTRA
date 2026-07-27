import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Filter, AlertCircle, Plus, Trash2, Calendar, 
  Download, UserPlus, Save, Edit2, Check, X, FileDown, Eye, RefreshCw, HelpCircle, Upload
} from 'lucide-react';
import { StudentAttendance, CalculationFormula } from '../types';
import { calculateStudentSummary, calculateEkstraMaxMeetings, parseAttendanceData } from '../utils/parser';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceTableProps {
  students: StudentAttendance[];
  dates: string[];
  formula: CalculationFormula;
  setStudents: React.Dispatch<React.SetStateAction<StudentAttendance[]>>;
  setDates: React.Dispatch<React.SetStateAction<string[]>>;
  minAttendance: number;
  onResetAll?: () => void;
}

export default function AttendanceTable({ 
  students, 
  dates, 
  formula, 
  setStudents, 
  setDates,
  minAttendance,
  onResetAll
}: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEkstra, setSelectedEkstra] = useState('ALL');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [showOnlyLowAttendance, setShowOnlyLowAttendance] = useState(false);

  // Sorting and Pagination states
  const [sortBy, setSortBy] = useState<'EKSTRA_KELAS_NAMA' | 'KELAS_NAMA'>('EKSTRA_KELAS_NAMA');
  const [rowsPerPage, setRowsPerPage] = useState<number | 'ALL'>(30);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rawRows.length === 0) {
            alert('File excel kosong atau tidak terbaca.');
            return;
          }

          const { students: parsedStudents, dates: parsedDates, error: parseError } = parseAttendanceData(rawRows);
          
          if (parseError) {
            alert(parseError);
          } else if (parsedStudents.length === 0) {
            alert('Format kolom tidak sesuai. Pastikan ada kolom "Nama" atau "Name" dan beberapa kolom tanggal.');
          } else {
            setStudents(parsedStudents);
            setDates(parsedDates);
          }
        } catch (err) {
          console.error(err);
          alert('Gagal membaca file Excel. Pastikan format file sesuai (.xlsx, .xls, atau .csv).');
        }
      };
      reader.readAsArrayBuffer(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEkstra, selectedKelas, showOnlyLowAttendance, sortBy, rowsPerPage]);

  // Compute maximum meetings for each extracurricular activity based on max active attendance logs (H+S+I+A)
  const maxMeetingsMap = useMemo(() => calculateEkstraMaxMeetings(students, dates), [students, dates]);

  // Unique lists for filters
  const ekstras = Array.from(new Set(students.map(s => s.ekstra).filter(Boolean)));
  const classes = Array.from(new Set(students.map(s => s.kelas).filter(Boolean)));

  // Filter students based on search and selected options
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.ekstra.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEkstra = selectedEkstra === 'ALL' || student.ekstra === selectedEkstra;
    const matchesKelas = selectedKelas === 'ALL' || student.kelas === selectedKelas;
    
    if (showOnlyLowAttendance) {
      const maxMeetingsOfEkstra = maxMeetingsMap[student.ekstra] || 0;
      const summary = calculateStudentSummary(student, dates, formula, maxMeetingsOfEkstra);
      return matchesSearch && matchesEkstra && matchesKelas && summary.percentage < minAttendance;
    }

    return matchesSearch && matchesEkstra && matchesKelas;
  });

  // Sort students based on selected option
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      if (sortBy === 'EKSTRA_KELAS_NAMA') {
        const compEkstra = (a.ekstra || '').localeCompare(b.ekstra || '', 'id');
        if (compEkstra !== 0) return compEkstra;
        
        const compKelas = (a.kelas || '').localeCompare(b.kelas || '', 'id');
        if (compKelas !== 0) return compKelas;
        
        return (a.nama || '').localeCompare(b.nama || '', 'id');
      } else {
        const compKelas = (a.kelas || '').localeCompare(b.kelas || '', 'id');
        if (compKelas !== 0) return compKelas;
        
        return (a.nama || '').localeCompare(b.nama || '', 'id');
      }
    });
    return list;
  }, [filteredStudents, sortBy]);

  // Paginate sorted students
  const paginatedStudents = useMemo(() => {
    if (rowsPerPage === 'ALL') return sortedStudents;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedStudents, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (rowsPerPage === 'ALL') return 1;
    return Math.ceil(sortedStudents.length / rowsPerPage);
  }, [sortedStudents.length, rowsPerPage]);

  // Export to Excel File
  const handleExport = () => {
    if (students.length === 0) return;

    const data = students.map(student => {
      const maxMeetingsOfEkstra = maxMeetingsMap[student.ekstra] || 0;
      const summary = calculateStudentSummary(student, dates, formula, maxMeetingsOfEkstra);
      const row: any = {
        'No': student.no,
        'Nama Siswa': student.nama,
        'Kelas': student.kelas,
        'Ekstrakurikuler': student.ekstra,
      };
      
      dates.forEach(date => {
        row[date] = student.attendance[date] || '-';
      });

      row['H (Hadir)'] = summary.hCount;
      row['S (Sakit)'] = summary.sCount;
      row['I (Izin)'] = summary.iCount;
      row['A (Alpha)'] = summary.aCount;
      row['Persentase (%)'] = summary.percentage;
      row['Keterangan'] = summary.percentage >= minAttendance ? 'AMAN' : 'KURANG';
      return row;
    });

    const workbook = XLSX.utils.book_new();

    // Create a beautiful header with information about the export
    const headerRows = [
      ['REKAPITULASI PRESENSI KEHADIRAN SISWA EKSTRAKURIKULER'],
      [`Batas Minimal Kehadiran Aman: ${minAttendance}%`],
      [`Rumus Perhitungan: ${
        formula === 'ALL_STATUS' ? 'Hadir / Total Pertemuan (Semua Status)' :
        formula === 'EXCLUDE_SI' ? 'Hadir / (Total Pertemuan - Sakit - Izin)' :
        ' (Hadir + Sakit + Izin) / Total Pertemuan'
      }`],
      [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
      [] // Blank spacing line
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headerRows);
    
    // Append JSON data starting at Row 6 (A6)
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A6' });

    // Fit column widths nicely, skipping the top titles to prevent extreme stretching
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(key => {
      const headerLen = key.length;
      const maxValLen = Math.max(
        ...data.map(r => r[key] !== undefined && r[key] !== null ? r[key].toString().length : 0)
      );
      return { wch: Math.max(headerLen, maxValLen) + 3 };
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Kehadiran');

    XLSX.writeFile(workbook, `Rekap_Kehadiran_Ekstra_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF File
  const handleExportPDF = () => {
    if (filteredStudents.length === 0) return;

    // Create PDF document
    // Always use landscape for attendance reports because of the date columns
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('LAPORAN REKAPITULASI PRESENSI SISWA EKSTRAKURIKULER', 14, 15);

    // Subtitle info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600

    const formulaText = 
      formula === 'ALL_STATUS' ? 'Hadir / Total Pertemuan (Semua Status)' :
      formula === 'EXCLUDE_SI' ? 'Hadir / (Total Pertemuan - Sakit - Izin)' :
      '(Hadir + Sakit + Izin) / Total Pertemuan';

    // Metadata Left Column
    doc.text(`Ekstrakurikuler : ${selectedEkstra === 'ALL' ? 'Semua Ekstrakurikuler' : selectedEkstra}`, 14, 22);
    doc.text(`Kelas              : ${selectedKelas === 'ALL' ? 'Semua Kelas' : selectedKelas}`, 14, 26);
    doc.text(`Batas Minimal  : ${minAttendance}% Kehadiran Aman`, 14, 30);

    // Metadata Right Column
    doc.text(`Rumus Perhitungan : ${formulaText}`, 155, 22);
    doc.text(`Jumlah Siswa          : ${filteredStudents.length} siswa`, 155, 26);
    doc.text(`Tanggal Unduh       : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 155, 30);

    // Header separating line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 33, 283, 33);

    // Define table columns
    const tableColumns = [
      { header: 'No', dataKey: 'no' },
      { header: 'Nama Siswa', dataKey: 'nama' },
      { header: 'Kelas', dataKey: 'kelas' },
      { header: 'Ekstrakurikuler', dataKey: 'ekstra' },
      ...dates.map(date => ({ header: date, dataKey: date })),
      { header: 'H', dataKey: 'hCount' },
      { header: 'S', dataKey: 'sCount' },
      { header: 'I', dataKey: 'iCount' },
      { header: 'A', dataKey: 'aCount' },
      { header: '%', dataKey: 'percentage' },
      { header: 'Keterangan', dataKey: 'keterangan' }
    ];

    // Define table body data
    const tableBody = filteredStudents.map((student, idx) => {
      const maxMeetingsOfEkstra = maxMeetingsMap[student.ekstra] || 0;
      const summary = calculateStudentSummary(student, dates, formula, maxMeetingsOfEkstra);
      const row: any = {
        no: idx + 1,
        nama: student.nama,
        kelas: student.kelas,
        ekstra: student.ekstra,
        hCount: summary.hCount,
        sCount: summary.sCount,
        iCount: summary.iCount,
        aCount: summary.aCount,
        percentage: `${summary.percentage.toFixed(1)}%`,
        keterangan: summary.percentage >= minAttendance ? 'AMAN' : 'KURANG'
      };
      dates.forEach(date => {
        row[date] = student.attendance[date] || '-';
      });
      return row;
    });

    // Draw table using autoTable
    autoTable(doc, {
      columns: tableColumns,
      body: tableBody,
      startY: 37,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        valign: 'middle',
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        no: { halign: 'center', cellWidth: 8 },
        nama: { fontStyle: 'bold', cellWidth: 42 },
        kelas: { halign: 'center', cellWidth: 18 },
        ekstra: { cellWidth: 28 },
        hCount: { halign: 'center', cellWidth: 7 },
        sCount: { halign: 'center', cellWidth: 7 },
        iCount: { halign: 'center', cellWidth: 7 },
        aCount: { halign: 'center', cellWidth: 7 },
        percentage: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        keterangan: { halign: 'center', fontStyle: 'bold', cellWidth: 18 }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          // Center align date cells
          if (dates.includes(data.column.key)) {
            data.cell.styles.halign = 'center';
          }

          if (data.column.key === 'keterangan') {
            if (data.cell.text[0] === 'AMAN') {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.text[0] === 'KURANG') {
              data.cell.styles.textColor = [220, 38, 38]; // rose-600
              data.cell.styles.fontStyle = 'bold';
            }
          }

          // Highlight individual symbols nicely
          if (typeof data.cell.text[0] === 'string') {
            const val = data.cell.text[0].trim();
            if (val === '-') {
              data.cell.styles.textColor = [148, 163, 184]; // slate-400
            } else if (val === 'H') {
              data.cell.styles.textColor = [37, 99, 235]; // blue-600
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'S') {
              data.cell.styles.textColor = [13, 148, 136]; // teal-600
            } else if (val === 'I') {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
            } else if (val === 'A') {
              data.cell.styles.textColor = [220, 38, 38]; // rose-600
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      didDrawPage: (data: any) => {
        const str = `Halaman ${data.pageNumber} dari ${doc.internal.pages.length - 1}`;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(str, doc.internal.pageSize.width - 14 - doc.getTextWidth(str), doc.internal.pageSize.height - 10);
        doc.text('Aplikasi Rekap Absensi Ekstrakurikuler', 14, doc.internal.pageSize.height - 10);
      }
    });

    // Save the file
    const fileDateStr = new Date().toISOString().split('T')[0];
    const ekstraSuffix = selectedEkstra === 'ALL' ? 'Semua' : selectedEkstra.replace(/\s+/g, '_');
    const docName = `Rekap_Presensi_${ekstraSuffix}_${fileDateStr}.pdf`;
    doc.save(docName);
  };

  // Clear All Data
  const handleReset = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      setStudents([]);
      setDates([]);
      localStorage.removeItem('eskul_attendance_students');
      localStorage.removeItem('eskul_attendance_dates');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden" id="attendance-table-container">
      
      {/* Table Toolbar / Filters */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 dark:bg-slate-950/20">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md" id="search-bar-wrapper">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, kelas, atau eskul..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            id="search-input"
          />
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Ekstra Filter */}
          <div className="flex items-center gap-1.5" id="filter-ekstra-wrapper">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEkstra}
              onChange={(e) => setSelectedEkstra(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-700 dark:text-slate-300"
              id="filter-ekstra-select"
            >
              <option value="ALL">Semua Ekstra</option>
              {ekstras.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Kelas Filter */}
          <div className="flex items-center gap-1.5" id="filter-kelas-wrapper">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-700 dark:text-slate-300"
              id="filter-kelas-select"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sorting Select */}
          <div className="flex items-center gap-1.5" id="sort-selector-wrapper">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Urutan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
              id="sort-by-select"
            >
              <option value="EKSTRA_KELAS_NAMA">Urut Ekstra, Urut Kelas, Urut Nama</option>
              <option value="KELAS_NAMA">Urut Kelas, Urut Nama</option>
            </select>
          </div>

          {/* Low Attendance Filter Toggle */}
          <button
            onClick={() => setShowOnlyLowAttendance(!showOnlyLowAttendance)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showOnlyLowAttendance 
                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            id="btn-filter-low-attendance"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Kehadiran &lt; {minAttendance}% ({
              students.filter(s => {
                const maxMeetingsOfEkstra = maxMeetingsMap[s.ekstra] || 0;
                return calculateStudentSummary(s, dates, formula, maxMeetingsOfEkstra).percentage < minAttendance;
              }).length
            })</span>
          </button>

          {/* Actions - Export and Import */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              id="table-toolbar-file-input"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              id="btn-upload-excel-toolbar"
              title="Unggah file Excel baru untuk mengganti data saat ini"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Unggah Excel</span>
            </button>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-100/50 dark:shadow-none transition-colors"
              id="btn-export-excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md shadow-rose-100/50 dark:shadow-none transition-colors"
              id="btn-export-pdf"
              title="Unduh laporan rekapitulasi presensi siswa dalam format PDF siap cetak"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              id="btn-reset-data-table"
              title="Hapus seluruh data absensi dan mulai baru"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>

        </div>

      </div>

      {/* Info Banner about Static Data and Dynamic Denominator Formula */}
      <div className="mx-5 my-4 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-start gap-3 text-xs text-indigo-800 dark:text-indigo-300" id="info-formula-banner">
        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Informasi Sistem Absensi:</span>
          <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
            Data kehadiran bersifat <span className="font-semibold text-indigo-600 dark:text-indigo-400">pasti (read-only)</span>. 
            Mengingat setiap ekstrakurikuler memiliki jumlah pertemuan berbeda, persentase kehadiran dihitung secara adil berdasarkan <span className="font-semibold text-indigo-600 dark:text-indigo-400">jumlah total pertemuan aktif terbesar (maksimum H+S+I+A)</span> pada masing-masing ekstrakurikuler tersebut.
          </p>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto w-full" id="table-scroll-container">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <p className="font-medium mb-1">Tidak ada data siswa ditemukan</p>
            <p className="text-xs">Coba upload file Excel atau paste tabel rekap yang valid.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-auto min-w-[800px]" id="students-attendance-grid">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                
                {/* Meta Columns Headers */}
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3 min-w-[200px] sticky left-0 z-10 bg-slate-100 dark:bg-slate-950 shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">Nama Siswa</th>
                <th className="px-3 py-3 w-20">Kelas</th>
                <th className="px-3 py-3 min-w-[140px]">Ekstra</th>

                {/* Date Columns Headers */}
                {dates.map((date, idx) => (
                  <th key={`${date}-${idx}`} className="px-2 py-3 text-center min-w-[80px] border-l border-slate-200/50 dark:border-slate-800/50 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {date}
                  </th>
                ))}

                {/* Summary Headers */}
                <th className="px-3 py-3 text-center w-12 border-l-2 border-slate-300 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-sans">H</th>
                <th className="px-3 py-3 text-center w-12 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-sans">S</th>
                <th className="px-3 py-3 text-center w-12 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 font-sans">I</th>
                <th className="px-3 py-3 text-center w-12 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-sans">A</th>
                <th className="px-4 py-3 text-center w-28 bg-indigo-600 text-white font-sans">PROSENTASE</th>
                <th className="px-4 py-3 text-center w-28 bg-indigo-750 text-white font-sans rounded-tr-lg">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedStudents.map((student, sIdx) => {
                const maxMeetingsOfEkstra = maxMeetingsMap[student.ekstra] || 0;
                const summary = calculateStudentSummary(student, dates, formula, maxMeetingsOfEkstra);

                return (
                  <tr 
                    key={student.id} 
                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      sIdx % 2 === 0 ? 'bg-white dark:bg-slate-900/30' : 'bg-slate-50/30 dark:bg-slate-950/10'
                    }`}
                  >
                    
                    {/* No */}
                    <td className="px-3 py-3 text-center font-mono text-slate-400">{student.no}</td>

                    {/* Nama (Static) */}
                    <td className={`px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 sticky left-0 shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)] z-10 transition-colors ${
                      sIdx % 2 === 0 
                        ? 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90' 
                        : 'bg-slate-50 dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90'
                    }`}>
                      <span>{student.nama}</span>
                    </td>

                    {/* Kelas (Static) */}
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      <span>{student.kelas}</span>
                    </td>

                    {/* Ekstra (Static) */}
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      <span>{student.ekstra}</span>
                    </td>

                    {/* Date Attendance Cells (Static Badges) */}
                    {dates.map((date, idx) => {
                      const status = student.attendance[date] || '-';
                      let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
                      
                      if (status === 'H') {
                        badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/20';
                      } else if (status === 'S') {
                        badgeStyle = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/40 dark:border-blue-900/20';
                      } else if (status === 'I') {
                        badgeStyle = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 border border-amber-200/40 dark:border-amber-900/20';
                      } else if (status === 'A') {
                        badgeStyle = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/40 dark:border-rose-900/20';
                      }
                      
                      return (
                        <td 
                          key={`${date}-${idx}`} 
                          className="px-2 py-2 text-center border-l border-slate-100 dark:border-slate-800/40"
                        >
                          <div className="flex justify-center items-center">
                            <span 
                              className={`inline-flex items-center justify-center w-7 h-7 font-bold rounded-lg text-xs ${badgeStyle}`}
                              title={
                                status === 'H' ? 'Hadir' : 
                                status === 'S' ? 'Sakit' : 
                                status === 'I' ? 'Izin' : 
                                status === 'A' ? 'Alpha (Tanpa Keterangan)' : 'Belum Absen'
                              }
                            >
                              {status}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Summary Counts */}
                    <td className="px-3 py-3 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 border-l-2 border-slate-300 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/10">
                      {summary.hCount}
                    </td>
                    <td className="px-3 py-3 text-center font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10">
                      {summary.sCount}
                    </td>
                    <td className="px-3 py-3 text-center font-bold font-mono text-amber-600 dark:text-amber-500 bg-amber-50/20 dark:bg-amber-950/10">
                      {summary.iCount}
                    </td>
                    <td className="px-3 py-3 text-center font-bold font-mono text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                      {summary.aCount}
                    </td>

                    {/* Attendance Percentage Badge */}
                    <td className="px-4 py-3 text-center font-mono font-extrabold bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-[13px] ${
                          summary.percentage >= minAttendance 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {summary.percentage.toFixed(1)}%
                        </span>
                        
                        {/* Tiny custom progress meter */}
                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              summary.percentage >= minAttendance ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${summary.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Keterangan Badge */}
                    <td className="px-4 py-3 text-center bg-slate-100/30 dark:bg-slate-900/30 border-l border-slate-100 dark:border-slate-800/40">
                      <div className="flex justify-center items-center font-sans">
                        {summary.percentage >= minAttendance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/50 dark:border-emerald-900/40 uppercase tracking-wider">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>AMAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200/50 dark:border-rose-900/40 uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>KURANG</span>
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Row Controls */}
      {sortedStudents.length > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs" id="pagination-controls-bar">
          
          {/* Left: Info and Limit Selector */}
          <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>
              Menampilkan{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {rowsPerPage === 'ALL' ? 1 : (currentPage - 1) * rowsPerPage + 1}
              </span>
              {' '}-{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {rowsPerPage === 'ALL' 
                  ? sortedStudents.length 
                  : Math.min(currentPage * rowsPerPage, sortedStudents.length)}
              </span>
              {' '}dari{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sortedStudents.length}
              </span>
              {' '}siswa
            </span>
            
            <span className="text-slate-300 dark:text-slate-700">|</span>
            
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setRowsPerPage(val === 'ALL' ? 'ALL' : Number(val));
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-700 dark:text-slate-300 outline-none"
                id="rows-per-page-select"
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">Semua</option>
              </select>
              <span>baris</span>
            </div>
          </div>

          {/* Right: Navigation Buttons */}
          {rowsPerPage !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1 justify-center sm:justify-end" id="pagination-buttons-wrapper">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                id="btn-pagination-prev"
              >
                Sebelumnya
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded text-xs font-semibold cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      id={`btn-pagination-page-${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                id="btn-pagination-next"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
