import { useState, useEffect, useCallback } from 'react';
import { Tab, Student, Subject, Grade, User } from './types';
import * as api from './api';
import { initSampleData } from './data';
import { getAuthState, logout as authLogout, isAuthenticated } from './auth';
import LoginPage from './components/LoginPage';
import ProfileDropdown from './components/ProfileDropdown';
import ProfileModal from './components/ProfileModal';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import SubjectManagement from './components/SubjectManagement';
import GradeManagement from './components/GradeManagement';
import Transcript from './components/Transcript';
import Statistics from './components/Statistics';
import GeminiChat from './components/GeminiChat';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, FileText, BarChart3,
  GraduationCap, Database, Cloud, HardDrive, Loader2, LogOut
} from 'lucide-react';

const tabs: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" />, color: 'text-blue-500' },
  { id: 'students', label: 'Sinh viên', icon: <Users className="w-5 h-5" />, color: 'text-blue-500' },
  { id: 'subjects', label: 'Môn học', icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-500' },
  { id: 'grades', label: 'Điểm số', icon: <ClipboardList className="w-5 h-5" />, color: 'text-violet-500' },
  { id: 'transcript', label: 'Bảng điểm', icon: <FileText className="w-5 h-5" />, color: 'text-amber-500' },
  { id: 'statistics', label: 'Thống kê', icon: <BarChart3 className="w-5 h-5" />, color: 'text-indigo-500' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [modalMode, setModalMode] = useState<'profile' | 'password' | null>(null);

  // Check auth on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const { user } = getAuthState();
      setCurrentUser(user);
    }
    setAuthChecked(true);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [s, sub, g] = await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getGrades(),
      ]);
      setStudents(s);
      setSubjects(sub);
      setGrades(g);
      setIsOnline(api.isApiMode());
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      initSampleData();
      loadData();
    }
  }, [currentUser, loadData]);

  const handleLogin = (user: User, _token: string) => {
    setCurrentUser(user);
    setLoading(true);
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      authLogout();
      setCurrentUser(null);
      setActiveTab('dashboard');
      setStudents([]);
      setSubjects([]);
      setGrades([]);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleResetData = async () => {
    if (confirm('Bạn có chắc muốn xóa TẤT CẢ dữ liệu và khôi phục dữ liệu mẫu?\n\nHành động này không thể hoàn tác!')) {
      setLoading(true);
      try {
        await api.seedData();
        api.resetApiCheck();
        await loadData();
      } catch (err) {
        console.error('Error resetting data:', err);
        localStorage.removeItem('students');
        localStorage.removeItem('subjects');
        localStorage.removeItem('grades');
        initSampleData();
        await loadData();
      }
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 text-lg">Đang tải dữ liệu...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard students={students} subjects={subjects} grades={grades} setActiveTab={handleTabChange} />;
      case 'students':
        return <StudentManagement students={students} onRefresh={loadData} />;
      case 'subjects':
        return <SubjectManagement subjects={subjects} onRefresh={loadData} />;
      case 'grades':
        return <GradeManagement students={students} subjects={subjects} grades={grades} onRefresh={loadData} />;
      case 'transcript':
        return <Transcript students={students} subjects={subjects} grades={grades} />;
      case 'statistics':
        return <Statistics students={students} subjects={subjects} grades={grades} />;
      default:
        return null;
    }
  };

  const userInitials = currentUser.fullName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
 return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar - chỉ hiện trên desktop lg+ */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-gray-100 shadow-lg lg:shadow-none flex-col transition-transform duration-300 hidden lg:flex ${
        sidebarOpen ? 'translate-x-0 !flex' : '-translate-x-full lg:translate-x-0'
      } print:hidden`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src="/logo2.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">UTT Grade</h1>
              <p className="text-xs text-gray-400">Quản Lý Điểm Sinh Viên</p>
            </div>
          </div>
        </div>

        {/* User info in sidebar */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {currentUser.role === 'admin' ? '🛡️ Quản trị viên' : '👨‍🏫 Giảng viên'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu chính</p>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === tab.id ? tab.color : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          {currentUser.role === 'admin' && (
            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Database className="w-5 h-5" />
              Khôi phục dữ liệu mẫu
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
          <div className="mt-3 px-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">PostgreSQL Online</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 font-medium">LocalStorage</span>
                </>
              )}
            </div>
            <p className="mt-1">v2.0 • {students.length} SV • {subjects.length} MH</p>
          </div>
        </div>
      </aside>
 {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            {/* Logo nhỏ trên mobile topbar */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">UTT Grade</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <span>📍</span>
              <span className="font-medium text-gray-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isOnline ? 'Database Mode' : 'Offline Mode'}
            </div>
            <ProfileDropdown
              user={currentUser}
              onLogout={handleLogout}
              onOpenProfile={() => setModalMode('profile')}
              onOpenChangePassword={() => setModalMode('password')}
            />
          </div>
        </header>
        {/* Content - thêm padding bottom cho mobile để không bị bottom nav che */}
        <div className="flex-1 p-3 sm:p-5 lg:p-8 max-w-[1400px] mx-auto w-full pb-24 lg:pb-8">
          {renderContent()}
        </div>
      </main>
      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl print:hidden">
        {/* Tab title trên mobile */}
        <div className="flex items-center justify-center py-1 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        {/* Navigation items */}
        <div className="grid grid-cols-6 items-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 scale-110'
                  : ''
              }`}>
                {tab.icon}
              </div>
              <span className={`text-[9px] font-medium mt-0.5 leading-tight text-center ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </div>
        {/* Safe area for phones with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </nav>

      {/* Profile / Password Modal */}
      {modalMode && (
        <ProfileModal
          user={currentUser}
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onUserUpdate={handleUserUpdate}
        />
      )}
      {/* Gemini AI Chatbot */}
      <GeminiChat
        students={students}
        subjects={subjects}
        grades={grades}
        apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''}
      />
    </div>
  );
