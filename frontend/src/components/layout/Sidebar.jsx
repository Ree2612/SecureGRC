import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  ShieldAlert,
  Grid3X3,
  ShieldCheck,
  Network,
  AlertTriangle,
  ListTodo,
  Server,
  FileText,
  Settings,
  LogOut,
  Shield,
  Building2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'RISK',
    items: [
      { name: 'Risk Register', href: '/risks', icon: ShieldAlert },
      { name: 'Risk Heatmap', href: '/heatmap', icon: Grid3X3 },
    ],
  },
  {
    title: 'COMPLIANCE',
    items: [
      { name: 'Control Assessment', href: '/controls', icon: ShieldCheck },
      { name: 'Framework Mapping', href: '/frameworks', icon: Network },
      { name: 'Gap Analysis', href: '/gaps', icon: AlertTriangle },
    ],
  },
  {
    title: 'REMEDIATION & ASSETS',
    items: [
      { name: 'Remediation Tracker', href: '/remediation', icon: ListTodo },
      { name: 'Asset Inventory', href: '/assets', icon: Server },
    ],
  },
  {
    title: 'REPORTING',
    items: [
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({ mobileOpen = false, onCloseMobile, organizationName }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 dark:bg-black/80 backdrop-blur-[2px] md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-border dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-border dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-subtle">
                <Shield className="w-4 h-4" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight block">SecureGRC</span>
                <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400 tracking-wider uppercase mt-0.5 block">Enterprise Console</span>
              </div>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150',
                            isActive
                              ? 'bg-blue-50/90 dark:bg-blue-950/60 text-primary-700 dark:text-primary-300 font-semibold border-l-2 border-primary-600 rounded-l-none pl-2.5'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                          )
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile & Footer */}
        <div className="p-3 border-t border-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Org Display */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-[11px] font-medium truncate text-slate-700 dark:text-slate-300">
              {organizationName || 'Apex CyberShield'}
            </span>
          </div>

          {/* User & Logout */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-border dark:hover:border-slate-700">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0 border border-primary-200 dark:border-primary-800">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {user?.role || 'Security Team'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
