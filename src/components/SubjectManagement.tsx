import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Subject } from '../types';
import * as api from '../api';
import { Plus, Search, Edit2, Trash2, X, BookOpen, BookPlus, Loader2, Filter } from 'lucide-react';
import { useToast } from './Toast';

interface Props {
  subjects: Subject[];
  onRefresh: () => Promise<void>;
}

const emptyForm = {
  subjectId: '', name: '', credits: 3, department: '', semester: '',
};

export default function SubjectManagement({ subjects, onRefresh }: Props) {
  const toast = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  }, []);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const departments = useMemo(() => [...new Set(subjects.map(s => s.department))].filter(Boolean).sort(), [subjects]);
  const semesters = useMemo(() => [...new Set(subjects.map(s => s.semester))].filter(Boolean).sort(), [subjects]);

  const filtered = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.subjectId.toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || s.department === filterDept;
      const matchSem = !filterSemester || s.semester === filterSemester;
      return matchSearch && matchDept && matchSem;
    });
  }, [subjects, search, filterDept, filterSemester]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.subjectId.trim()) errs.subjectId = 'Mã MH không được để trống';
    if (!form.name.trim()) errs.name = 'Tên MH không được để trống';
    if (form.credits < 1 || form.credits > 10) errs.credits = 'Số tín chỉ: 1-10';
    const existing = subjects.find(s => s.subjectId === form.subjectId && s.id !== editingId);
    if (existing) errs.subjectId = 'Mã MH đã tồn tại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSubject(editingId, form);
        toast.success('Cập nhật thành công!', `Đã cập nhật môn học ${form.name}`);
      } else {
        await api.addSubject(form);
        toast.success('Thêm thành công!', `Đã thêm môn học ${form.name}`);
      }
      await onRefresh();
      resetForm();
    } catch (err) {
      console.error('Error saving subject:', err);
      toast.error('Lỗi!', 'Không thể lưu môn học. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setForm({
      subjectId: subject.subjectId,
      name: subject.name,
      credits: subject.credits,
      department: subject.department,
      semester: subject.semester,
    });
    setEditingId(subject.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Xóa môn học "${subject.name}" (${subject.subjectId})?\nTất cả điểm liên quan cũng sẽ bị xóa.`)) return;
    try {
      await api.deleteSubject(subject.id);
      await onRefresh();
      toast.success('Đã xóa!', `Môn học ${subject.name} đã được xóa`);
    } catch {
      toast.error('Lỗi!', 'Không thể xóa môn học.');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const activeFilters = (search ? 1 : 0) + (filterDept ? 1 : 0) + (filterSemester ? 1 : 0);

  return (
    <div className="space-y-5 page-transition">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-500" /> Quản Lý Môn Học
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {filtered.length} / {subjects.length} môn học • {subjects.reduce((s, sub) => s + sub.credits, 0)} tín chỉ
            {activeFilters > 0 && <span className="ml-2 text-emerald-600 font-medium">(đang lọc)</span>}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl
            hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 font-semibold
            hover:scale-[1.02] active:scale-[0.98] btn-ripple"
        >
          <BookPlus className="w-4 h-4" /> Thêm Môn Học
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm theo tên, mã môn học..."
            value={searchInput} onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm bg-white"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-white min-w-[170px] text-sm appearance-none">
            <option value="">Tất cả khoa</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {filterDept && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">1</span>}
        </div>
        <div className="relative">
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-white min-w-[140px] text-sm">
            <option value="">Tất cả HK</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {filterSemester && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">1</span>}
        </div>
      </div>

      {(search || filterDept || filterSemester) && (
        <p className="text-sm text-gray-500 animate-fade-in-up">
          Tìm thấy <strong className="text-gray-800">{filtered.length}</strong> kết quả
        </p>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? '✏️ Sửa Môn Học' : '➕ Thêm Môn Học Mới'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn học *</label>
                  <input type="text" value={form.subjectId}
                    onChange={e => setForm({ ...form, subjectId: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.subjectId ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                    placeholder="VD: MH001"
                  />
                  {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tín chỉ *</label>
                  <input type="number" value={form.credits} min={1} max={10}
                    onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.credits ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                  />
                  {errors.credits && <p className="text-red-500 text-xs mt-1">{errors.credits}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:border-emerald-500 outline-none`}
                  placeholder="VD: Lập trình C++"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khoa/Bộ môn</label>
                  <input type="text" value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    placeholder="VD: CNTT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
                  <input type="text" value={form.semester}
                    onChange={e => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none"
                    placeholder="VD: HK1-2024"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 font-medium">Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50">
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
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold">{search || filterDept || filterSemester ? 'Không tìm thấy môn học' : 'Chưa có môn học nào'}</p>
            <p className="text-gray-400 text-sm mt-1">{search || filterDept || filterSemester ? 'Thử thay đổi bộ lọc' : 'Nhấn "Thêm Môn Học" để bắt đầu'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold">#</th>
                  <th className="px-4 py-3.5 font-semibold">Mã MH</th>
                  <th className="px-4 py-3.5 font-semibold">Tên môn học</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Tín chỉ</th>
                  <th className="px-4 py-3.5 font-semibold">Khoa/Bộ môn</th>
                  <th className="px-4 py-3.5 font-semibold">Học kỳ</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((subject, index) => (
                  <tr key={subject.id} className="border-t border-gray-50 hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-sm">{subject.subjectId}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm">{subject.credits}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{subject.department || '–'}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold">{subject.semester || '–'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(subject)} className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-all hover:scale-110" title="Sửa"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(subject)} className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-all hover:scale-110" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
            <span>Hiển thị <strong>{filtered.length}</strong> / {subjects.length} môn học</span>
            {activeFilters > 0 && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setFilterDept(''); setFilterSemester(''); }}
                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
