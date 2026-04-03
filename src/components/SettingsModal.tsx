import { useState, useEffect } from 'react';
import { Student, Subject, Grade } from '../types';
import {
  X, Palette, Bell, Database, Info, Moon, Sun, Type, Download,
  Shield, Clock, Wifi, CheckCircle, ChevronRight, Monitor, Volume2,
  VolumeX, Save, RotateCcw, Globe, Cpu, HardDrive, Activity
} from 'lucide-react';
import { useToast } from './Toast';

interface Props {
  onClose: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  students: Student[];
  subjects: Subject[];
  grades: Grade[];
}

type Category = 'display' | 'notifications' | 'data' | 'system';

const accentColors = [
  { id: 'blue',    name: 'Xanh dương', class: 'bg-blue-500',   hex: '#3b82f6' },
  { id: 'violet',  name: 'Tím',         class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'emerald', name: 'Xanh lá',     class: 'bg-emerald-500',hex: '#10b981' },
  { id: 'rose',    name: 'Hồng',        class: 'bg-rose-500',   hex: '#f43f5e' },
  { id: 'amber',   name: 'Vàng',        class: 'bg-amber-500',  hex: '#f59e0b' },
  { id: 'indigo',  name: 'Chàm',        class: 'bg-indigo-500', hex: '#6366f1' },
];

const fontSizes = [
  { id: 'sm',  label: 'Nhỏ',   px: '13px' },
  { id: 'md',  label: 'Vừa',   px: '15px' },
  { id: 'lg',  label: 'Lớn',   px: '17px' },
];

export default function SettingsModal({ onClose, darkMode, onToggleDark, students, subjects, grades }: Props) {
  const toast = useToast();
  const [category, setCategory] = useState<Category>('display');

  // Settings state — đọc từ localStorage
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'md');
  const [accent,   setAccent]   = useState(() => localStorage.getItem('accentColor') || 'violet');
  const [notifyToast, setNotifyToast]   = useState(() => localStorage.getItem('notifyToast') !== 'false');
  const [notifySound, setNotifySound]   = useState(() => localStorage.getItem('notifySound') === 'true');
  const [autoBackup, setAutoBackup]     = useState(() => localStorage.getItem('autoBackup') === 'true');
  const [compactView, setCompactView]   = useState(() => localStorage.getItem('compactView') === 'true');

  // Apply font size
  useEffect(() => {
    const size = fontSizes.find(f => f.id === fontSize);
    if (size) document.documentElement.style.fontSize = size.px;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply accent color as CSS variable
  useEffect(() => {
    const color = accentColors.find(c => c.id === accent);
    if (color) document.documentElement.style.setProperty('--accent', color.hex);
    localStorage.setItem('accentColor', accent);
  }, [accent]);

  useEffect(() => { localStorage.setItem('notifyToast', String(notifyToast)); }, [notifyToast]);
  useEffect(() => { localStorage.setItem('notifySound', String(notifySound)); }, [notifySound]);
  useEffect(() => { localStorage.setItem('autoBackup', String(autoBackup)); }, [autoBackup]);
  useEffect(() => { localStorage.setItem('compactView', String(compactView)); }, [compactView]);

  const handleExportData = () => {
    const data = { students, subjects, grades, exportedAt: new Date().toISOString(), version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utt-grade-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Xuất thành công!', `Đã tải xuống ${students.length} SV, ${grades.length} bản ghi điểm`);
  };

  const handleResetPreferences = () => {
    if (!confirm('Đặt lại tất cả tùy chọn về mặc định?')) return;
    setFontSize('md');
    setAccent('violet');
    setNotifyToast(true);
    setNotifySound(false);
    setAutoBackup(false);
    setCompactView(false);
    if (darkMode) onToggleDark(); // reset về light
    toast.info('Đã đặt lại!', 'Tất cả tùy chọn đã về mặc định');
  };

  const storageUsed = (() => {
    let total = 0;
    for (const key of ['students','subjects','grades']) {
      total += (localStorage.getItem(key) || '').length;
    }
    return (total / 1024).toFixed(1);
  })();

  const loginTime = (() => {
    const t = sessionStorage.getItem('loginTime') || Date.now().toString();
    if (!sessionStorage.getItem('loginTime')) sessionStorage.setItem('loginTime', t);
    const diff = Math.floor((Date.now() - Number(t)) / 60000);
    return diff < 1 ? 'Vừa đăng nhập' : `${diff} phút trước`;
  })();

  const categories = [
    { id: 'display'       as Category, icon: Palette,  label: 'Giao diện'       },
    { id: 'notifications' as Category, icon: Bell,     label: 'Thông báo'       },
    { id: 'data'          as Category, icon: Database,  label: 'Dữ liệu & Bảo mật' },
    { id: 'system'        as Category, icon: Info,      label: 'Hệ thống'        },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Cài đặt</h2>
              <p className="text-xs text-gray-400">Tùy chỉnh giao diện và hệ thống</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-44 border-r border-gray-100 p-3 flex flex-col gap-1 flex-shrink-0">
            {categories.map(cat => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-500' : 'text-gray-400'}`} />
                  <span className="truncate">{cat.label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ===== GIAO DIỆN ===== */}
            {category === 'display' && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-gray-900">Giao diện & Hiển thị</h3>

                {/* Dark Mode */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Chế độ tối</p>
                        <p className="text-xs text-gray-500">{darkMode ? 'Đang bật — nền tối, chữ sáng' : 'Đang tắt — nền sáng, chữ tối'}</p>
                      </div>
                    </div>
                    <button onClick={onToggleDark}
                      className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Type className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Cỡ chữ</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {fontSizes.map(f => (
                      <button key={f.id} onClick={() => setFontSize(f.id)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          fontSize === f.id
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        <span style={{ fontSize: f.px }}>{f.label}</span>
                        <br />
                        <span className="text-[10px] text-gray-400">{f.px}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Màu chủ đạo</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {accentColors.map(c => (
                      <button key={c.id} onClick={() => setAccent(c.id)}
                        title={c.name}
                        className={`group flex flex-col items-center gap-1.5 transition-all`}>
                        <div className={`w-9 h-9 ${c.class} rounded-xl shadow-sm transition-all ${
                          accent === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                        }`}>
                          {accent === c.id && (
                            <div className="w-full h-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact View */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Giao diện thu gọn</p>
                        <p className="text-xs text-gray-500">Giảm khoảng cách, hiển thị nhiều dữ liệu hơn</p>
                      </div>
                    </div>
                    <button onClick={() => setCompactView(!compactView)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${compactView ? 'bg-violet-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${compactView ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Reset button */}
                <button onClick={handleResetPreferences}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors mt-2">
                  <RotateCcw className="w-4 h-4" />
                  Đặt lại về mặc định
                </button>
              </div>
            )}

            {/* ===== THÔNG BÁO ===== */}
            {category === 'notifications' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-gray-900">Cài đặt thông báo</h3>

                {[
                  {
                    icon: Bell, state: notifyToast, toggle: () => setNotifyToast(!notifyToast),
                    title: 'Popup thông báo (Toast)',
                    desc: 'Hiển thị thông báo khi thêm/sửa/xóa dữ liệu',
                    color: 'bg-blue-500',
                  },
                  {
                    icon: notifySound ? Volume2 : VolumeX,
                    state: notifySound, toggle: () => setNotifySound(!notifySound),
                    title: 'Âm thanh thông báo',
                    desc: 'Phát âm thanh khi có thông báo mới',
                    color: 'bg-purple-500',
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                        <button onClick={item.toggle}
                          className={`relative w-12 h-6 rounded-full transition-colors ${item.state ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.state ? 'translate-x-6' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Notification preview */}
                <div className="p-4 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs text-gray-500 mb-3 font-medium">XEM THỬ THÔNG BÁO</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['success','error','warning','info'] as const).map(type => (
                      <button key={type} onClick={() => {
                        const msgs = {
                          success: ['Thành công!', 'Thao tác hoàn thành'],
                          error:   ['Lỗi!',        'Đã xảy ra lỗi hệ thống'],
                          warning: ['Cảnh báo!',   'Vui lòng kiểm tra lại'],
                          info:    ['Thông tin',   'Phiên bản mới đã sẵn sàng'],
                        };
                        (useToast as unknown as () => {success: Function; error: Function; warning: Function; info: Function});
                        // Just trigger via the hook approach
                        toast[type](msgs[type][0], msgs[type][1]);
                      }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${
                          type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                          type === 'error'   ? 'bg-red-100 text-red-700' :
                          type === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {type === 'success' ? '✓ Thành công' : type === 'error' ? '✗ Lỗi' : type === 'warning' ? '⚠ Cảnh báo' : 'ℹ Thông tin'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== DỮ LIỆU & BẢO MẬT ===== */}
            {category === 'data' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-gray-900">Dữ liệu & Bảo mật</h3>

                {/* Storage info */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Bộ nhớ đang dùng</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Sinh viên',  value: students.length, color: 'text-blue-600' },
                      { label: 'Môn học',    value: subjects.length, color: 'text-emerald-600' },
                      { label: 'Bản ghi Điểm', value: grades.length,   color: 'text-violet-600' },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-xl p-3 shadow-sm">
                        <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Chiếm ~{storageUsed} KB trong localStorage</span>
                  </div>
                </div>

                {/* Export */}
                <button onClick={handleExportData}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl hover:from-violet-100 hover:to-purple-100 transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-gray-800">Xuất dữ liệu (JSON)</p>
                    <p className="text-xs text-gray-500">Tải xuống toàn bộ SV, môn học và điểm</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-violet-400" />
                </button>

                {/* Auto backup */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Save className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Backup tự động</p>
                        <p className="text-xs text-gray-500">Tự lưu dữ liệu mỗi 30 phút</p>
                      </div>
                    </div>
                    <button onClick={() => setAutoBackup(!autoBackup)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${autoBackup ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoBackup ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Session info */}
                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Phiên đăng nhập hiện tại</span>
                  </div>
                  {[
                    { icon: Clock,  label: 'Thời gian đăng nhập', value: loginTime },
                    { icon: Globe,  label: 'Trình duyệt',          value: navigator.userAgent.includes('Chrome') ? 'Google Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Trình duyệt khác' },
                    { icon: Wifi,   label: 'Trạng thái',           value: navigator.onLine ? '🟢 Trực tuyến' : '🔴 Ngoại tuyến' },
                  ].map(row => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{row.label}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{row.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== HỆ THỐNG ===== */}
            {category === 'system' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-gray-900">Thông tin hệ thống</h3>

                {/* App info card */}
                <div className="p-5 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-lg">UTT Grade</p>
                      <p className="text-violet-200 text-xs">Hệ thống Quản lý Điểm Sinh viên</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Phiên bản', value: 'v2.0.0' },
                      { label: 'Build',     value: '2026.04' },
                      { label: 'React',     value: '18.x' },
                      { label: 'TypeScript',value: '5.x' },
                    ].map(item => (
                      <div key={item.label} className="bg-white/10 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-violet-200">{item.label}</p>
                        <p className="text-sm font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech stack */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Công nghệ sử dụng</p>
                  <div className="space-y-2">
                    {[
                      { icon: Cpu,       tech: 'React 18', desc: 'UI Framework',         color: 'bg-blue-500' },
                      { icon: Globe,     tech: 'TypeScript 5', desc: 'Ngôn ngữ lập trình', color: 'bg-indigo-500' },
                      { icon: Palette,   tech: 'Tailwind CSS v4', desc: 'Styling',         color: 'bg-cyan-500' },
                      { icon: Activity,  tech: 'Vite',     desc: 'Build Tool',            color: 'bg-purple-500' },
                      { icon: HardDrive, tech: 'LocalStorage / PostgreSQL', desc: 'Lưu trữ dữ liệu', color: 'bg-emerald-500' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.tech} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{item.tech}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-700">Hệ thống hoạt động bình thường</span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1.5 ml-4.5">
                    Tất cả dịch vụ đang chạy ổn định • Cập nhật lần cuối: hôm nay
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
