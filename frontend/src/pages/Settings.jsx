import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getSettings, updateSettings, getOrganizations, switchOrganization } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { useTheme } from '@/lib/ThemeContext';
import { AddOrganizationModal } from '@/components/organizations/AddOrganizationModal';
import { Building2, ShieldCheck, UserCheck, Lock, Bell, CheckCircle2, Sun, Moon, Plus, Check } from 'lucide-react';

export function Settings() {
  const toast = useToast();
  const { theme, setTheme, isDark } = useTheme();
  const { reloadOrganizations } = useOutletContext() || {};

  const [settings, setSettings] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  const [formData, setFormData] = useState({
    organization_name: '',
    industry: '',
    region: '',
    primary_framework: 'NIST CSF 2.0',
    mfa_enforced: true,
    session_timeout_minutes: 60,
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, orgsData] = await Promise.all([
        getSettings(),
        getOrganizations(),
      ]);
      setSettings(settingsData);
      setOrganizations(Array.isArray(orgsData) ? orgsData : []);

      if (settingsData?.organization) {
        setFormData({
          organization_name: settingsData.organization.name || '',
          industry: settingsData.organization.industry || '',
          region: settingsData.organization.region || '',
          primary_framework: settingsData.organization.primary_framework || 'NIST CSF 2.0',
          mfa_enforced: settingsData.security?.mfa_enforced ?? true,
          session_timeout_minutes: settingsData.security?.session_timeout_minutes ?? 60,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      toast.success('Settings Saved', 'Platform and organization configurations updated.');
      loadSettings();
      reloadOrganizations?.();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchCompany = async (orgId, orgName) => {
    try {
      await switchOrganization(orgId);
      toast.success('Switched Active Company', `Now managing: ${orgName}`);
      loadSettings();
      reloadOrganizations?.();
    } catch (err) {
      toast.error('Switch Failed', err.message);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadSettings} />;
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Platform Settings & Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-company workspaces, framework baselines, display appearance, and security policies.
          </p>
        </div>
      </div>

      {/* Multi-Company / Tenant Management */}
      <Card>
        <CardHeader
          title="Connected Organizations & Entities"
          description="Switch between managed business units or create a dedicated tenant for another company"
          action={
            <Button
              size="xs"
              icon={Plus}
              onClick={() => setShowAddCompanyModal(true)}
            >
              Add Company
            </Button>
          }
        />
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {organizations.map((org) => {
              const isCurrent = org.id === settings.organization.id;
              return (
                <div
                  key={org.id}
                  onClick={() => !isCurrent && handleSwitchCompany(org.id, org.name)}
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-primary-500 bg-blue-50/40 dark:bg-blue-950/30 dark:border-primary-600'
                      : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {org.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {org.industry} • {org.region}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Baseline: {org.primary_framework}
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600 text-white flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <Button size="xs" variant="secondary">
                        Switch
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Theme Setting */}
      <Card>
        <CardHeader
          title="Appearance & Interface Theme"
          description="Customize display contrast and theme mode"
        />
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                !isDark
                  ? 'border-primary-600 bg-blue-50/50 dark:bg-blue-950/40 text-primary-700 font-bold ring-2 ring-primary-500'
                  : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                isDark
                  ? 'border-primary-600 bg-slate-850 text-white font-bold ring-2 ring-primary-500'
                  : 'border-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs">Dark Mode</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Active Organization Profile */}
        <Card>
          <CardHeader
            title="Active Organization Profile"
            description="Manage corporate entity information and tenant parameters"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Legal Name"
                value={formData.organization_name}
                onChange={(e) =>
                  setFormData({ ...formData, organization_name: e.target.value })
                }
                required
              />
              <Input
                label="Industry Vertical"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Operating Region / Data Residency"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Baseline Framework
                </label>
                <select
                  value={formData.primary_framework}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_framework: e.target.value })
                  }
                  className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="NIST CSF 2.0">NIST CSF 2.0</option>
                  <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
                  <option value="CIS Controls v8">CIS Controls v8</option>
                  <option value="SOC 2 Trust Services Criteria">SOC 2 Trust Services Criteria</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">License Tier:</span>
                <Badge variant="primary">{settings.organization.plan}</Badge>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Organization ID: {settings.organization.id}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Account Info */}
        <Card>
          <CardHeader
            title="Active Session & Operator"
            description="Current authenticated user identity and role assignment"
          />
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                  Name & Email
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                  {settings.user.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{settings.user.email}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                  RBAC Role
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                  {settings.user.role}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium block">
                  Active Access Privileges
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Controls */}
        <Card>
          <CardHeader
            title="Enterprise Security Enforcements"
            description="Global access policies and compliance audit safeguards"
          />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  Hardware Token & FIDO2 Multi-Factor Authentication
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Require adaptive MFA for all console administrator logins.
                </div>
              </div>
              <Badge variant="success">Enforced</Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  Session Inactivity Timeout
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Automatically invalidate idle operator tokens after 60 minutes.
                </div>
              </div>
              <Badge variant="neutral">60 min</Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-800 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  Tamper-Evident Audit Logging
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  All configuration changes recorded to immutable audit journal.
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" isLoading={saving}>
            Save Configuration
          </Button>
        </div>
      </form>

      <AddOrganizationModal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        onOrganizationCreated={() => {
          loadSettings();
          reloadOrganizations?.();
        }}
      />
    </div>
  );
}
