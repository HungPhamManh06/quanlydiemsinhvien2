import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Student, Subject, Grade } from '../types';
import * as api from '../api';
import {
  X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle,
  Loader2, ChevronDown, ChevronUp, FileWarning, Check, Info
} from 'lucide-react';
import { useToast } from './Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type ImportType = 'students' | 'subjects' | 'grades';

interface RowResult {
  row: number;
  status: 'valid' | 'invalid' | 'success' | 'failed';
  data: Record<string, string | number | null>;
  errors: string[];
  message?: string;
}

interface Props {
  type: ImportType;
  students?: Student[];
  subjects?: Subject[];
  grades?: Grade[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

// ─── Template Definitions ────────────────────────────────────────────────────

const TEMPLATES: Record<ImportType, { headers: string[]; sample: (string | number)[][] }> = {
  students: {
    headers: ['Mã SV', 'Họ tên', 'Lớp', 'Giới tính', 'Ngày sinh', 'Email', 'Số điện thoại', 'Địa chỉ'],
    sample: [
      ['SV001', 'Nguyễn Văn An', 'CNTT-K20A', 'Nam', '2002-03-15', 'an.nv@university.edu.vn', '0901234567', 'Hà Nội'],
      ['SV002', 'Trần Thị Bình', 'CNTT-K20A', 'Nữ', '2002-07-22', 'binh.tt@university.edu.vn', '0912345678', 'Hải Phòng'],
    ],
  },
  subjects: {
    headers: ['Mã MH', 'Tên môn học', 'Số tín chỉ', 'Khoa/Bộ môn', 'Học kỳ'],
    sample: [
      ['MH001', 'Lập trình C++', 3, 'Công nghệ thông tin', 'HK1-2024'],
      ['MH002', 'Cơ sở dữ liệu', 4, 'Công nghệ thông tin', 'HK1-2024'],
    ],
  },
  grades: {
    headers: ['Mã SV', 'Mã MH', 'Học kỳ', 'Điểm chuyên cần (CC)', 'Điểm giữa kỳ (GK)', 'Điểm cuối kỳ (CK)'],
    sample: [
      ['SV001', 'MH001', 'HK1-2024', 9, 8.5, 7.5],
      ['SV001', 'MH002', 'HK1-2024', 8, 7, 8],
    ],
  },
};

const TYPE_LABELS: Record<ImportType, { title: string; color: string; icon: string }> = {
  students: { title: 'Sinh Viên', color: 'blue', icon: '👥' },
  subjects: { title: 'Môn Học', color: 'emerald', icon: '📚' },
  grades: { title: 'Điểm', color: 'violet', icon: '📝' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseScore(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function str(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExcelImportModal({ type, students = [], subjects = [], grades = [], onClose, onSuccess }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<RowResult[]>([]);
  const [phase, setPhase] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });
  const [showErrors, setShowErrors] = useState(false);

  const meta = TYPE_LABELS[type];
  const COLOR_MAP: Record<string, { badge: string; btn: string; border: string; ring: string }> = {
    blue: { badge: 'bg-blue-100 text-blue-700', btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25', border: 'border-blue-300 bg-blue-50', ring: 'ring-blue-500' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25', border: 'border-emerald-300 bg-emerald-50', ring: 'ring-emerald-500' },
    violet: { badge: 'bg-violet-100 text-violet-700', btn: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/25', border: 'border-violet-300 bg-violet-50', ring: 'ring-violet-500' },
  };
  const colorClass = COLOR_MAP[meta.color] ?? COLOR_MAP['blue'];

  // ── Validate rows ──────────────────────────────────────────────────────────

  function validateRow(raw: Record<string, unknown>, rowIdx: number): RowResult {
    const errors: string[] = [];
    const data: Record<string, string | number | null> = {};

    if (type === 'students') {
      const studentId = str(raw['Mã SV'] ?? raw['Ma SV'] ?? raw['MaSV'] ?? raw['student_id']);
      const name = str(raw['Họ tên'] ?? raw['Ho ten'] ?? raw['name']);
      const className = str(raw['Lớp'] ?? raw['Lop'] ?? raw['class']);
      const gender = str(raw['Giới tính'] ?? raw['Gioi tinh'] ?? raw['gender'] ?? 'Nam');
      const dob = str(raw['Ngày sinh'] ?? raw['Ngay sinh'] ?? raw['dateOfBirth'] ?? '');
      const email = str(raw['Email'] ?? raw['email'] ?? '');
      const phone = str(raw['Số điện thoại'] ?? raw['So dien thoai'] ?? raw['phone'] ?? '');
      const address = str(raw['Địa chỉ'] ?? raw['Dia chi'] ?? raw['address'] ?? '');

      if (!studentId) errors.push('Mã SV không được để trống');
      if (!name) errors.push('Họ tên không được để trống');
      if (!className) errors.push('Lớp không được để trống');
      if (gender && gender !== 'Nam' && gender !== 'Nữ' && gender !== 'Nu')
        errors.push('Giới tính phải là "Nam" hoặc "Nữ"');
      if (students.find(s => s.studentId === studentId))
        errors.push(`Mã SV "${studentId}" đã tồn tại`);

      data.studentId = studentId;
      data.name = name;
      data.className = className;
      data.gender = gender === 'Nu' ? 'Nữ' : gender || 'Nam';
      data.dateOfBirth = dob;
      data.email = email;
      data.phone = phone;
      data.address = address;
    }

    if (type === 'subjects') {
      const subjectId = str(raw['Mã MH'] ?? raw['Ma MH'] ?? raw['MaMH'] ?? raw['subject_id']);
      const name = str(raw['Tên môn học'] ?? raw['Ten mon hoc'] ?? raw['name']);
      const credits = parseScore(raw['Số tín chỉ'] ?? raw['So tin chi'] ?? raw['credits']);
      const department = str(raw['Khoa/Bộ môn'] ?? raw['Khoa'] ?? raw['department'] ?? '');
      const semester = str(raw['Học kỳ'] ?? raw['Hoc ky'] ?? raw['semester'] ?? '');

      if (!subjectId) errors.push('Mã MH không được để trống');
      if (!name) errors.push('Tên môn học không được để trống');
      if (credits === null || credits < 1 || credits > 10) errors.push('Số tín chỉ phải là số từ 1-10');
      if (subjects.find(s => s.subjectId === subjectId))
        errors.push(`Mã MH "${subjectId}" đã tồn tại`);

      data.subjectId = subjectId;
      data.name = name;
      data.credits = credits ?? 3;
      data.department = department;
      data.semester = semester;
    }

    if (type === 'grades') {
      const svId = str(raw['Mã SV'] ?? raw['Ma SV'] ?? raw['MaSV']);
      const mhId = str(raw['Mã MH'] ?? raw['Ma MH'] ?? raw['MaMH']);
      const semester = str(raw['Học kỳ'] ?? raw['Hoc ky'] ?? raw['semester'] ?? '');
      const cc = parseScore(raw['Điểm chuyên cần (CC)'] ?? raw['CC'] ?? raw['attendance']);
      const gk = parseScore(raw['Điểm giữa kỳ (GK)'] ?? raw['GK'] ?? raw['midterm']);
      const ck = parseScore(raw['Điểm cuối kỳ (CK)'] ?? raw['CK'] ?? raw['final']);

      const student = students.find(s => s.studentId === svId);
      const subject = subjects.find(s => s.subjectId === mhId);

      if (!svId) errors.push('Mã SV không được để trống');
      else if (!student) errors.push(`Mã SV "${svId}" không tồn tại trong hệ thống`);

      if (!mhId) errors.push('Mã MH không được để trống');
      else if (!subject) errors.push(`Mã MH "${mhId}" không tồn tại trong hệ thống`);

      if (!semester) errors.push('Học kỳ không được để trống');

      if (cc !== null && (cc < 0 || cc > 10)) errors.push('Điểm CC phải từ 0-10');
      if (gk !== null && (gk < 0 || gk > 10)) errors.push('Điểm GK phải từ 0-10');
      if (ck !== null && (ck < 0 || ck > 10)) errors.push('Điểm CK phải từ 0-10');

      if (student && subject) {
        const dup = grades.find(g => g.studentId === student.id && g.subjectId === subject.id && g.semester === semester);
        if (dup) errors.push(`Đã có điểm môn này trong học kỳ ${semester}`);
      }

      data.studentId = student?.id ?? svId;
      data.subjectId = subject?.id ?? mhId;
      data.studentCode = svId;
      data.subjectCode = mhId;
      data.semester = semester;
      data.attendanceScore = cc;
      data.midtermScore = gk;
      data.finalScore = ck;
    }

    return { row: rowIdx, status: errors.length > 0 ? 'invalid' : 'valid', data, errors };
  }

  // ── Parse Excel ────────────────────────────────────────────────────────────

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        if (rawRows.length === 0) {
          toast.error('Lỗi!', 'File Excel không có dữ liệu hoặc sheet trống.');
          return;
        }

        const validated = rawRows.map((r, i) => validateRow(r, i + 2));
        setRows(validated);
        setPhase('preview');
      } catch {
        toast.error('Lỗi!', 'Không thể đọc file. Hãy đảm bảo file là .xlsx hoặc .xls hợp lệ.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileDrop(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Lỗi!', 'Chỉ hỗ trợ file .xlsx hoặc .xls');
      return;
    }
    setFileName(file.name);
    parseFile(file);
  }

  // ── Download Template ──────────────────────────────────────────────────────

  function downloadTemplate() {
    const tpl = TEMPLATES[type];
    const ws = XLSX.utils.aoa_to_sheet([tpl.headers, ...tpl.sample]);

    // Style header row width
    const colWidths = tpl.headers.map(h => ({ wch: Math.max(h.length + 5, 18) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu');
    XLSX.writeFile(wb, `mau_import_${type}.xlsx`);
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    const validRows = rows.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;

    setPhase('importing');
    setProgress(0);

    const results = [...rows];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      if (row.status === 'invalid') {
        failed++;
        setProgress(Math.round((i + 1) / results.length * 100));
        continue;
      }

      try {
        if (type === 'students') {
          await api.addStudent({
            studentId: str(row.data.studentId),
            name: str(row.data.name),
            className: str(row.data.className),
            gender: (row.data.gender as 'Nam' | 'Nữ') || 'Nam',
            dateOfBirth: str(row.data.dateOfBirth),
            email: str(row.data.email),
            phone: str(row.data.phone),
            address: str(row.data.address),
          });
        } else if (type === 'subjects') {
          await api.addSubject({
            subjectId: str(row.data.subjectId),
            name: str(row.data.name),
            credits: (row.data.credits as number) || 3,
            department: str(row.data.department),
            semester: str(row.data.semester),
          });
        } else if (type === 'grades') {
          await api.addGrade({
            studentId: str(row.data.studentId),
            subjectId: str(row.data.subjectId),
            semester: str(row.data.semester),
            attendanceScore: row.data.attendanceScore as number | null,
            midtermScore: row.data.midtermScore as number | null,
            finalScore: row.data.finalScore as number | null,
          });
        }
        results[i] = { ...row, status: 'success', message: 'Thêm thành công' };
        success++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
        results[i] = { ...row, status: 'failed', message: msg };
        failed++;
      }

      setProgress(Math.round((i + 1) / results.length * 100));
      // Small delay to let UI update
      await new Promise(r => setTimeout(r, 30));
    }

    setRows(results);
    setImportStats({ success, failed });
    setPhase('done');

    if (success > 0) {
      await onSuccess();
      toast.success('Import hoàn tất!', `${success} dòng thêm thành công${failed > 0 ? `, ${failed} dòng thất bại` : ''}`);
    } else {
      toast.error('Import thất bại!', 'Không có dòng nào được thêm thành công.');
    }
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileDrop(file);
  }, [students, subjects, grades]); // eslint-disable-line

  const validCount = rows.filter(r => r.status === 'valid').length;
  const invalidCount = rows.filter(r => r.status === 'invalid').length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={phase === 'importing' ? undefined : onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colorClass.badge}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {meta.icon} Import {meta.title} từ Excel
              </h2>
              <p className="text-xs text-gray-500">Upload file .xlsx hoặc .xls để thêm dữ liệu hàng loạt</p>
            </div>
          </div>
          {phase !== 'importing' && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Phase: Upload ── */}
          {phase === 'upload' && (
            <div className="p-6 space-y-5">
              {/* Template download */}
              <div className={`rounded-xl p-4 border ${colorClass.border} flex items-start gap-3`}>
                <Info className="w-5 h-5 mt-0.5 shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Tải file mẫu trước khi import</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    File mẫu chứa đầy đủ cột cần thiết và dữ liệu ví dụ để tham khảo
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Tải mẫu
                </button>
              </div>

              {/* Columns info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Các cột trong file Excel</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES[type].headers.map((h, i) => (
                    <span key={h} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${i < (type === 'students' ? 3 : type === 'subjects' ? 3 : 3) ? colorClass.badge : 'bg-gray-100 text-gray-600'}`}>
                      {i < (type === 'students' ? 3 : type === 'subjects' ? 3 : 3) ? '* ' : ''}{h}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  <span className={`font-semibold ${meta.color === 'blue' ? 'text-blue-600' : meta.color === 'emerald' ? 'text-emerald-600' : 'text-violet-600'}`}>*</span> Trường bắt buộc
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                  ${dragging ? `border-current ${colorClass.border} scale-[1.01]` : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100/80'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dragging ? colorClass.badge : 'bg-white shadow-md'}`}>
                  <Upload className={`w-7 h-7 ${dragging ? '' : 'text-gray-400'}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">Kéo &amp; thả file vào đây</p>
                  <p className="text-sm text-gray-400">hoặc <span className="text-blue-600 font-semibold underline">nhấn để chọn file</span></p>
                </div>
                <p className="text-xs text-gray-400">Hỗ trợ .xlsx, .xls • Tối đa 10,000 dòng</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); e.target.value = ''; }}
                />
              </div>
            </div>
          )}

          {/* ── Phase: Preview ── */}
          {phase === 'preview' && (
            <div className="p-6 space-y-4">
              {/* Stats bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700 truncate max-w-[200px]">{fileName}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl text-sm text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span className="font-semibold">{validCount} hợp lệ</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">{invalidCount} lỗi</span>
                  </div>
                )}
                <button
                  onClick={() => { setPhase('upload'); setRows([]); setFileName(''); }}
                  className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Chọn lại
                </button>
              </div>

              {/* Collapsible error summary */}
              {invalidCount > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowErrors(e => !e)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-left"
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <FileWarning className="w-4 h-4" />
                      <span className="text-sm font-semibold">{invalidCount} dòng có lỗi — sẽ bị bỏ qua khi import</span>
                    </div>
                    {showErrors ? <ChevronUp className="w-4 h-4 text-red-500" /> : <ChevronDown className="w-4 h-4 text-red-500" />}
                  </button>
                  {showErrors && (
                    <div className="divide-y divide-red-100">
                      {rows.filter(r => r.status === 'invalid').map(r => (
                        <div key={r.row} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-xs text-red-400 font-mono mt-0.5 shrink-0">Dòng {r.row}</span>
                          <div className="text-xs text-red-600 space-y-0.5">
                            {r.errors.map((e, i) => <p key={i}>• {e}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[320px]">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Dòng</th>
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Trạng thái</th>
                        {type === 'students' && <>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Mã SV</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Họ tên</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Lớp</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Giới tính</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Email</th>
                        </>}
                        {type === 'subjects' && <>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Mã MH</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Tên môn học</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Tín chỉ</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Khoa</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Học kỳ</th>
                        </>}
                        {type === 'grades' && <>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Mã SV</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Mã MH</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Học kỳ</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500">CC</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500">GK</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500">CK</th>
                        </>}
                        <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.row}
                          className={`border-t border-gray-100 ${r.status === 'invalid' ? 'bg-red-50/60' : 'hover:bg-gray-50/60'}`}>
                          <td className="px-3 py-2 text-gray-400 font-mono">{r.row}</td>
                          <td className="px-3 py-2">
                            {r.status === 'valid'
                              ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" />Hợp lệ</span>
                              : <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" />Lỗi</span>
                            }
                          </td>
                          {type === 'students' && <>
                            <td className="px-3 py-2 font-mono text-blue-600">{str(r.data.studentId)}</td>
                            <td className="px-3 py-2 font-semibold">{str(r.data.name)}</td>
                            <td className="px-3 py-2">{str(r.data.className)}</td>
                            <td className="px-3 py-2">{str(r.data.gender)}</td>
                            <td className="px-3 py-2 text-gray-500 truncate max-w-[150px]">{str(r.data.email) || '–'}</td>
                          </>}
                          {type === 'subjects' && <>
                            <td className="px-3 py-2 font-mono text-emerald-600">{str(r.data.subjectId)}</td>
                            <td className="px-3 py-2 font-semibold">{str(r.data.name)}</td>
                            <td className="px-3 py-2 text-center">{r.data.credits}</td>
                            <td className="px-3 py-2 text-gray-500">{str(r.data.department) || '–'}</td>
                            <td className="px-3 py-2">{str(r.data.semester) || '–'}</td>
                          </>}
                          {type === 'grades' && <>
                            <td className="px-3 py-2 font-mono text-violet-600">{str(r.data.studentCode)}</td>
                            <td className="px-3 py-2 font-mono text-violet-600">{str(r.data.subjectCode)}</td>
                            <td className="px-3 py-2">{str(r.data.semester)}</td>
                            <td className="px-3 py-2 text-center">{r.data.attendanceScore ?? '–'}</td>
                            <td className="px-3 py-2 text-center">{r.data.midtermScore ?? '–'}</td>
                            <td className="px-3 py-2 text-center">{r.data.finalScore ?? '–'}</td>
                          </>}
                          <td className="px-3 py-2 text-red-500 text-[11px] max-w-[200px]">
                            {r.errors.join(' • ') || '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Phase: Importing ── */}
          {phase === 'importing' && (
            <div className="p-8 flex flex-col items-center justify-center gap-6 min-h-[280px]">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${colorClass.badge}`}>
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-lg">Đang import dữ liệu...</p>
                <p className="text-gray-500 text-sm mt-1">Vui lòng không đóng cửa sổ này</p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm text-gray-600 font-semibold">
                  <span>Tiến độ</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${meta.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : meta.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Phase: Done ── */}
          {phase === 'done' && (
            <div className="p-6 space-y-4">
              {/* Result summary */}
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className={`px-6 py-5 flex items-center gap-4 ${importStats.success > 0 ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-red-50 border-b border-red-200'}`}>
                  {importStats.success > 0
                    ? <CheckCircle className="w-10 h-10 text-emerald-500 shrink-0" />
                    : <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
                  }
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Import hoàn tất</p>
                    <p className="text-sm text-gray-600">
                      <span className="text-emerald-600 font-bold">{importStats.success} thành công</span>
                      {importStats.failed > 0 && <> · <span className="text-red-600 font-bold">{importStats.failed} thất bại</span></>}
                    </p>
                  </div>
                </div>
                {/* Per-row results */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                  {rows.map(r => (
                    <div key={r.row} className={`px-4 py-2.5 flex items-center gap-3 ${r.status === 'failed' ? 'bg-red-50/50' : r.status === 'invalid' ? 'bg-amber-50/50' : ''}`}>
                      <span className="text-xs text-gray-400 font-mono w-12 shrink-0">Dòng {r.row}</span>
                      {r.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {r.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      {r.status === 'invalid' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="text-xs text-gray-600 truncate">
                        {type === 'students' && str(r.data.name)}
                        {type === 'subjects' && str(r.data.name)}
                        {type === 'grades' && `${str(r.data.studentCode)} - ${str(r.data.subjectCode)}`}
                      </span>
                      <span className={`ml-auto text-xs font-semibold shrink-0 ${r.status === 'success' ? 'text-emerald-600' : r.status === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                        {r.status === 'success' ? 'Thành công' : r.status === 'failed' ? r.message || 'Thất bại' : 'Bỏ qua (lỗi)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
          {phase === 'upload' && (
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors">
              Hủy
            </button>
          )}

          {phase === 'preview' && (
            <>
              <button onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors">
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg
                  ${colorClass.btn} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]`}
              >
                <Upload className="w-4 h-4" />
                Import {validCount} dòng hợp lệ
              </button>
            </>
          )}

          {phase === 'done' && (
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg ${colorClass.btn}`}
            >
              <Check className="w-4 h-4" /> Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
