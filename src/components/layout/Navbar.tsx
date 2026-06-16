import { NavLink } from 'react-router-dom';
import { FileText, Activity, GitCompare, Download, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/create', label: '创建', icon: FileText },
  { path: '/diagnose', label: '诊断', icon: Activity },
  { path: '/compare', label: '对照', icon: GitCompare },
  { path: '/export', label: '导出', icon: Download },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-700 rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                作品集诊断
              </h1>
              <p className="text-xs text-stone-500">转专业申请助手</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
