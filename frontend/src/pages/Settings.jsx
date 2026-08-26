import React, { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { Building2, ShieldCheck, UserCheck, Lock, Bell, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      const data = await getSettings();
      setSettings(data);
      if (data?.organization) {
        setFormData({
          organization_name: data.organization.name || '',
          industry: data.organization.industry || '',
          region: data.organization.region || '',
          primary_framework: data.organization.primary_framework || 'NIST CSF 2.0',
          mfa_enforced: data.security?.mfa_enforced ?? true,
          session_timeout_minutes: data.security?.session_timeout_minutes ?? 60,
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
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setSaving(false);
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
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your organization profile, primary framework alignments, and security enforcement policies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Profile */}
        <Card>
          <CardHeader
            title="Organization Profile"
            description="Manage corporate entity information and tenant preferences"
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
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Primary Baseline Framework
                </label>
                <select
                  value={formData.primary_framework}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_framework: e.target.value })
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="NIST CSF 2.0">NIST CSF 2.0</option>
                  <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
                  <option value="CIS Controls v8">CIS Controls v8</option>
                  <option value="SOC 2 Trust Services Criteria">SOC 2 Trust Services Criteria</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">License Tier:</span>
                <Badge variant="primary">{settings.organization.plan}</Badge>
              </div>
              <span className="text-[11px] text-slate-400">
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
              <div className="p-3 bg-slate-50 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Name & Email
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  {settings.user.name}
                </span>
                <span className="text-slate-500 text-[11px] block">{settings.user.email}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  RBAC Role
                </span>
                <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                  {settings.user.role}
                </span>
                <span className="text-emerald-700 text-[11px] font-medium block">
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
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 text-xs">
                  Hardware Token & FIDO2 Multi-Factor Authentication
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Require adaptive MFA for all console administrator logins.
                </div>
              </div>
              <Badge variant="success">Enforced</Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 text-xs">
                  Session Inactivity Timeout
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Automatically invalidate idle operator tokens after 60 minutes.
                </div>
              </div>
              <Badge variant="neutral">60 min</Badge>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-border rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 text-xs">
                  Tamper-Evident Audit Logging
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
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
    </div>
  );
}
