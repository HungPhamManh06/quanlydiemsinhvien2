import { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  ChevronDown, LogOut, UserCircle, Settings, KeyRound, Shield
} from 'lucide-react';

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenChangePassword: () => void;
  onOpenSettings: () => void;
}

export default function ProfileDropdown({ user, onLogout, onOpenProfile, onOpenChangePassword, onOpenSettings }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.fullName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user.role === 'admin' ? 'Quản trị viên' : 'Giảng viên';
  const roleColor = user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-800 leading-tight">{user.fullName}</p>
          <p className="text-[10px] text-gray-400">{roleLabel}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${roleColor}`}>
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onOpenProfile(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-gray-400" />
              Hồ sơ cá nhân
            </button>
            <button
              onClick={() => { setOpen(false); onOpenChangePassword(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-gray-400" />
              Đổi mật khẩu
            </button>
            <button
              onClick={() => { setOpen(false); onOpenSettings(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              Cài đặt
            </button>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
