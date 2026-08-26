import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Bell,
  Menu,
  ChevronDown,
  Building2,
  Layers,
  Check,
  CheckCheck,
  ExternalLink,
  Shield
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api';
import { formatTimeAgo } from '@/lib/utils';

export function Topbar({
  onToggleMobile,
  organizations = [],
  selectedOrg,
  onSelectOrg,
  selectedFramework,
  onSelectFramework
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Generate Page Title & Breadcrumb from path
  const getRouteInfo = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return { title: 'Executive Overview', section: 'Overview' };
      case '/risks':
        return { title: 'Risk Register', section: 'Risk Management' };
      case '/heatmap':
        return { title: 'Risk Heatmap Matrix', section: 'Risk Management' };
      case '/controls':
        return { title: 'Control Assessment', section: 'Compliance' };
      case '/frameworks':
        return { title: 'Framework Cross-Walk Mapping', section: 'Compliance' };
      case '/gaps':
        return { title: 'Gap Analysis & Mitigation', section: 'Compliance' };
      case '/remediation':
        return { title: 'Remediation Tracker', section: 'Remediation' };
      case '/assets':
        return { title: 'Asset Inventory & Criticality', section: 'Assets' };
      case '/reports':
        return { title: 'Audit & Compliance Reports', section: 'Reporting' };
      case '/settings':
        return { title: 'Platform Settings', section: 'System' };
      default:
        return { title: 'Governance & Risk', section: 'SecureGRC' };
    }
  };

  const { title, section } = getRouteInfo(location.pathname);

  // Load notifications
  useEffect(() => {
    let mounted = true;
    getNotifications()
      .then((data) => {
        if (mounted && Array.isArray(data)) setNotifications(data);
      })
      .catch((err) => console.warn('Notifications load error:', err.message));

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      mounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Error marking all notifications read:', e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle, Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <span>{section}</span>
            <span>/</span>
            <span className="text-slate-700">{title}</span>
          </div>
          <h1 className="text-base font-semibold text-slate-900 leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Selectors & Notifications */}
      <div className="flex items-center gap-3">
        {/* Framework Selector */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-border px-2.5 py-1.5 rounded-md text-xs text-slate-700">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedFramework}
            onChange={(e) => onSelectFramework?.(e.target.value)}
            className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="NIST CSF 2.0">NIST CSF 2.0</option>
            <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
            <option value="CIS Controls v8">CIS Controls v8</option>
            <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
          </select>
        </div>

        {/* Organization Selector */}
        {organizations && organizations.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-border px-2.5 py-1.5 rounded-md text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const found = organizations.find((o) => o.id === e.target.value);
                if (found) onSelectOrg?.(found);
              }}
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md border border-border transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-modal border border-border overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-primary-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-600 shrink-0">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
