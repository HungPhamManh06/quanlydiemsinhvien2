import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Student } from '../types';
import * as api from '../api';
import { Plus, Search, Edit2, Trash2, X, UserPlus, Users, Loader2, Filter, UserCheck, FileSpreadsheet } from 'lucide-react';
import { useToast } from './Toast';
import ExcelImportModal from './ExcelImportModal';

interface Props {
  students: Student[];
  onRefresh: () => Promise<void>;
}

const emptyForm: {
  studentId: string; name: string; className: string; email: string; phone: string;
  dateOfBirth: string; gender: 'Nam' | 'Nữ'; address: string;
} = {
  studentId: '', name: '', className: '', email: '', phone: '',
  dateOfBirth: '', gender: 'Nam', address: '',
};

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return parts.slice(-2).map(p => p[0]).join('').toUpperCase() || '?';
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-sky-600',
  'from-indigo-400 to-indigo-700',
  'from-fuchsia-400 to-pink-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function StudentManagement({ students, onRefresh }: Props) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const classes = useMemo(() => [...new Set(students.map(s => s.className))].sort(), [students]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchClass = !filterClass || s.className === filterClass;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.studentId.trim()) errs.studentId = 'Mã SV không được để trống';
    if (!form.name.trim()) errs.name = 'Họ tên không được để trống';
    if (!form.className.trim()) errs.className = 'Lớp không được để trống';
    const existing = students.find(s => s.studentId === form.studentId && s.id !== editingId);
    if (existing) errs.studentId = 'Mã SV đã tồn tại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateStudent(editingId, form);
        toast.success('Cập nhật thành công!', `Đã cập nhật thông tin sinh viên ${form.name}`);
      } else {
        await api.addStudent(form);
        toast.success('Thêm thành công!', `Đã thêm sinh viên ${form.name}`);
      }
      await onRefresh();
      resetForm();
    } catch (err) {
      console.error('Error saving student:', err);
      toast.error('Lỗi!', 'Không thể lưu sinh viên. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      studentId: student.studentId, name: student.name, className: student.className,
      email: student.email, phone: student.phone, dateOfBirth: student.dateOfBirth,
      gender: student.gender, address: student.address,
    });
    setEditingId(student.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Xóa sinh viên "${student.name}" (${student.studentId})?\nTất cả điểm sẽ bị xóa theo.`)) return;
    try {
      await api.deleteStudent(student.id);
      await onRefresh();
      toast.success('Đã xóa!', `Sinh viên ${student.name} đã được xóa`);
    } catch {
      toast.error('Lỗi!', 'Không thể xóa sinh viên.');
    }
  };

  const resetForm = () => {
    setForm(emptyForm); setEditingId(null); setShowForm(false); setErrors({});
  };

  const activeFilters = (search ? 1 : 0) + (filterClass ? 1 : 0);

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" /> Quản Lý Sinh Viên
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filtered.length} / {students.length} sinh viên
            {activeFilters > 0 && <span className="ml-2 text-blue-600 font-medium">(đang lọc)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2.5 rounded-xl
              hover:bg-green-50 transition-all font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl
              hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 font-semibold
              hover:scale-[1.02] active:scale-[0.98] btn-ripple"
          >
            <UserPlus className="w-4 h-4" /> Thêm Sinh Viên
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã SV, email..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white text-sm"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white min-w-[170px] text-sm appearance-none"
          >
            <option value="">Tất cả lớp</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {filterClass && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">1</span>
          )}
        </div>
      </div>

      {/* Search result count */}
      {(search || filterClass) && (
        <p className="text-sm text-gray-500 animate-fade-in-up">
          Tìm thấy <strong className="text-gray-800">{filtered.length}</strong> kết quả
          {search && <> cho "<span className="text-blue-600 font-medium">{search}</span>"</>}
          {filterClass && <> · Lớp <span className="text-blue-600 font-medium">{filterClass}</span></>}
        </p>
      )}

      {/* Excel Import Modal */}
      {showImport && (
        <ExcelImportModal
          type="students"
          students={students}
          onClose={() => setShowImport(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Sửa Sinh Viên' : 'Thêm Sinh Viên Mới'}</h2>
                  <p className="text-xs text-gray-500">{editingId ? 'Cập nhật thông tin sinh viên' : 'Điền đầy đủ thông tin bên dưới'}</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Mã sinh viên *', key: 'studentId', placeholder: 'VD: SV001', type: 'text' },
                  { label: 'Họ và tên *', key: 'name', placeholder: 'Nguyễn Văn A', type: 'text' },
                  { label: 'Lớp *', key: 'className', placeholder: 'VD: CNTT-K20A', type: 'text' },
                  { label: 'Ngày sinh', key: 'dateOfBirth', placeholder: '', type: 'date' },
                  { label: 'Email', key: 'email', placeholder: 'email@university.edu.vn', type: 'email' },
                  { label: 'Số điện thoại', key: 'phone', placeholder: '0901234567', type: 'tel' },
                  { label: 'Địa chỉ', key: 'address', placeholder: 'Hà Nội', type: 'text' },
                ].map(field => (
                  <div key={field.key} className={field.key === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none
                        ${errors[field.key] ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500' :
                        'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-gray-50 focus:bg-white'}`}
                    />
                    {errors[field.key] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><X className="w-3 h-3" />{errors[field.key]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Giới tính</label>
                  <div className="flex gap-3">
                    {(['Nam', 'Nữ'] as const).map(g => (
                      <label key={g} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium
                        ${form.gender === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <input type="radio" value={g} checked={form.gender === g}
                          onChange={() => setForm({ ...form, gender: g })} className="sr-only" />
                        {g === 'Nam' ? '👨' : '👩'} {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                    text-white font-semibold flex items-center gap-2 disabled:opacity-60 transition-all shadow-md shadow-blue-500/20 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UserCheck className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-base">
              {search || filterClass ? 'Không tìm thấy sinh viên' : 'Chưa có sinh viên nào'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search || filterClass ? 'Thử thay đổi từ khóa hoặc bộ lọc' : 'Nhấn "Thêm Sinh Viên" để bắt đầu'}
            </p>
            {(search || filterClass) && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setFilterClass(''); }}
                className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-700">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm mobile-card-table">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold">#</th>
                  <th className="px-4 py-3.5 font-semibold">Sinh viên</th>
                  <th className="px-4 py-3.5 font-semibold">Lớp</th>
                  <th className="px-4 py-3.5 font-semibold">Giới tính</th>
                  <th className="px-4 py-3.5 font-semibold">Ngày sinh</th>
                  <th className="px-4 py-3.5 font-semibold">Email</th>
                  <th className="px-4 py-3.5 font-semibold">SĐT</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => {
                  const color = getAvatarColor(student.name);
                  const initials = getInitials(student.name);
                  return (
                    <tr key={student.id}
                      className="border-t border-gray-50 hover:bg-blue-50/40 transition-colors group">
                      <td className="px-4 py-3 text-gray-400 text-xs" data-label="#">{index + 1}</td>
                      <td className="px-4 py-3" data-label="Sinh viên">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">
                              <HighlightText text={student.name} query={search} />
                            </p>
                            <p className="text-[11px] text-blue-600 font-mono font-medium">
                              <HighlightText text={student.studentId} query={search} />
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" data-label="Lớp">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                          {student.className}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs" data-label="Giới tính">
                        {student.gender === 'Nam' ? '👨 Nam' : '👩 Nữ'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs" data-label="Ngày sinh">
                        {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '–'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate" data-label="Email">
                        <HighlightText text={student.email || '–'} query={search} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs" data-label="SĐT">{student.phone || '–'}</td>
                      <td className="px-4 py-3" data-label="Thao tác">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(student)}
                            className="p-2 hover:bg-blue-100 rounded-xl text-blue-600 transition-all hover:scale-110 active:scale-90" title="Sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(student)}
                            className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-all hover:scale-110 active:scale-90" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <span>Hiển thị <strong>{filtered.length}</strong> / {students.length} sinh viên</span>
            {activeFilters > 0 && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setFilterClass(''); }}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
