import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { login, register, resetPassword } from '../auth';
import {
  GraduationCap, User as UserIcon, Lock, Mail, Phone, Building2,
  Eye, EyeOff, LogIn, UserPlus, ArrowLeft, KeyRound, Loader2,
  CheckCircle2, XCircle, BookOpen, Users, BarChart3, Shield, Sparkles
} from 'lucide-react';

type PageView = 'login' | 'register' | 'forgot';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [view, setView] = useState<PageView>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearMessage = () => setMessage(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin!' });
      return;
    }

    setLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const result = login(loginUsername, loginPassword);
    setLoading(false);

    if (result.success && result.user && result.token) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => onLogin(result.user!, result.token!), 500);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();

    if (!regUsername || !regPassword || !regFullName || !regEmail) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin bắt buộc!' });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const result = register({
      username: regUsername,
      password: regPassword,
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      department: regDepartment,
      role: regRole,
    });
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        setView('login');
        setLoginUsername(regUsername);
        clearMessage();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();

    if (!forgotEmail.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email!' });
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const result = resetPassword(forgotEmail);
    setLoading(false);

    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const switchView = (newView: PageView) => {
    setView(newView);
    clearMessage();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const features = [
    { icon: <Users className="w-6 h-6" />, title: 'Quản lý sinh viên', desc: 'Thông tin sinh viên đầy đủ' },
    { icon: <BookOpen className="w-6 h-6" />, title: 'Quản lý môn học', desc: 'Danh mục môn học theo khoa' },
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Thống kê & Báo cáo', desc: 'Biểu đồ trực quan, xuất báo cáo' },
    { icon: <Shield className="w-6 h-6" />, title: 'Bảo mật', desc: 'Phân quyền admin, giảng viên' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Left side - Features (hidden on mobile) */}
      <div className={`hidden lg:flex flex-col justify-center w-1/2 relative z-10 p-12 xl:p-20 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">UTT Grade</h1>
              <p className="text-blue-200 text-sm">Hệ thống Quản lý Điểm Sinh viên</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Quản lý điểm số
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              thông minh & hiệu quả
            </span>
          </h2>

          <p className="text-blue-200/80 text-lg mb-10 leading-relaxed">
            Giải pháp toàn diện cho việc quản lý điểm học tập sinh viên tại các trường đại học.
            Giao diện hiện đại, dễ sử dụng với đầy đủ tính năng.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 group"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-xl flex items-center justify-center mb-3 text-blue-300 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-blue-300/60 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 text-blue-300/50 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Phiên bản 2.0 • Hỗ trợ PostgreSQL • Responsive</span>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center relative z-10 p-4 sm:p-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">UniGrade</h1>
                <p className="text-blue-200 text-xs">Quản lý Điểm Sinh viên</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
            
            {/* LOGIN VIEW */}
            {view === 'login' && (
              <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <LogIn className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Đăng Nhập</h2>
                  <p className="text-gray-500 text-sm mt-1">Chào mừng bạn quay trở lại</p>
                </div>

                {/* Message */}
                {message && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={e => setLoginUsername(e.target.value)}
                        placeholder="Nhập tên đăng nhập"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu"
                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Đăng Nhập
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Chưa có tài khoản?{' '}
                    <button
                      onClick={() => switchView('register')}
                      className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>

                {/* Demo accounts */}
                <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Tài khoản thử nghiệm
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => { setLoginUsername('admin'); setLoginPassword('admin123'); }}
                      className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-800">Admin</span>
                        <span className="text-xs text-gray-400 ml-2">admin / admin123</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-medium group-hover:bg-red-200 transition-colors">Quản trị</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginUsername('giangvien'); setLoginPassword('gv123456'); }}
                      className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-800">Giảng viên</span>
                        <span className="text-xs text-gray-400 ml-2">giangvien / gv123456</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-medium group-hover:bg-blue-200 transition-colors">Giảng viên</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER VIEW */}
            {view === 'register' && (
              <div className="p-8 sm:p-10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Đăng Ký</h2>
                  <p className="text-gray-500 text-sm mt-1">Tạo tài khoản mới</p>
                </div>

                {message && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-5 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tên đăng nhập *</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={regUsername}
                          onChange={e => setRegUsername(e.target.value)}
                          placeholder="username"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Họ và tên *</label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="email@university.edu.vn"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Ít nhất 6 ký tự"
                          className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Xác nhận MK *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại MK"
                          className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          placeholder="0123456789"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vai trò *</label>
                      <select
                        value={regRole}
                        onChange={e => setRegRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                      >
                        <option value="teacher">Giảng viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Khoa / Bộ môn</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={regDepartment}
                        onChange={e => setRegDepartment(e.target.value)}
                        placeholder="VD: Khoa Công Nghệ Thông Tin"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Đăng Ký</>}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    onClick={() => switchView('login')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng nhập
                  </button>
                </div>
              </div>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {view === 'forgot' && (
              <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Quên Mật Khẩu</h2>
                  <p className="text-gray-500 text-sm mt-1">Nhập email để khôi phục mật khẩu</p>
                </div>

                {message && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    <span className="text-xs sm:text-sm">{message.text}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="email@university.edu.vn"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:bg-white transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-5 h-5" /> Khôi phục mật khẩu</>}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => switchView('login')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng nhập
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-blue-200/50 text-xs">
            <p>© 2026 UTT Grade - Hệ thống Quản lý Điểm Sinh viên</p>
            <p className="mt-1">Phát triển bởi nhóm sinh viên Đại học CNGTVT </p>
          </div>
        </div>
      </div>
    </div>
  );
}
