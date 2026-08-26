import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import {
  Bell,
  Menu,
  ChevronDown,
  Building2,
  Layers,
  Check,
  CheckCheck,
  Plus,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api';
import { AddOrganizationModal } from '@/components/organizations/AddOrganizationModal';
import { formatTimeAgo } from '@/lib/utils';

export function Topbar({
  onToggleMobile,
  organizations = [],
  selectedOrg,
  onSelectOrg,
  selectedFramework,
  onSelectFramework,
  onOrganizationCreated
}) {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);

  const notifRef = useRef(null);
  const orgRef = useRef(null);

  // Generate Page Title & Section from route
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
      .catch(() => {});

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (orgRef.current && !orgRef.current.contains(e.target)) {
        setShowOrgDropdown(false);
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
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Left: Mobile Toggle, Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{section}</span>
              <span>/</span>
              <span className="text-slate-700 dark:text-slate-300">{title}</span>
            </div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Selectors, Dark Mode, & Notifications */}
        <div className="flex items-center gap-2.5">
          {/* Framework Selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-border dark:border-slate-700 px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={selectedFramework}
              onChange={(e) => onSelectFramework?.(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="NIST CSF 2.0" className="dark:bg-slate-900">NIST CSF 2.0</option>
              <option value="ISO/IEC 27001:2022" className="dark:bg-slate-900">ISO/IEC 27001:2022</option>
              <option value="CIS Controls v8" className="dark:bg-slate-900">CIS Controls v8</option>
              <option value="SOC 2 Trust Services Criteria" className="dark:bg-slate-900">SOC 2 TSC</option>
            </select>
          </div>

          {/* Company / Organization Dropdown & Add Button */}
          <div className="relative" ref={orgRef}>
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border dark:border-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="max-w-[140px] truncate">{selectedOrg?.name || 'Select Company'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showOrgDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-modal border border-border dark:border-slate-800 overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-border dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Company Workspaces
                  </span>
                  <button
                    onClick={() => {
                      setShowOrgDropdown(false);
                      setShowAddOrgModal(true);
                    }}
                    className="text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Company
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-border/60 dark:divide-slate-800/60">
                  {organizations.map((org) => {
                    const isSelected = org.id === selectedOrg?.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => {
                          onSelectOrg?.(org);
                          setShowOrgDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 text-xs ${
                          isSelected ? 'bg-blue-50/60 dark:bg-blue-950/40 text-primary-700 dark:text-primary-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate">{org.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {org.industry} • {org.region}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-border dark:border-slate-700 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md border border-border dark:border-slate-700 transition-colors"
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-lg shadow-modal border border-border dark:border-slate-800 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded text-[10px] font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border/60 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      No active notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !n.read ? 'bg-primary-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                              {formatTimeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
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

      {/* Add Organization Modal */}
      <AddOrganizationModal
        isOpen={showAddOrgModal}
        onClose={() => setShowAddOrgModal(false)}
        onOrganizationCreated={(newOrg) => {
          onOrganizationCreated?.(newOrg);
          onSelectOrg?.(newOrg);
        }}
      />
    </>
  );
}
