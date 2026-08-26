import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createOrganization } from '@/services/api';
import { useToast } from '@/lib/ToastContext';
import { Building2 } from 'lucide-react';

export function AddOrganizationModal({ isOpen, onClose, onOrganizationCreated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Financial Technology (FinTech)',
    region: 'US-East (N. Virginia)',
    size: '250-1000',
    plan: 'Enterprise',
    primary_framework: 'NIST CSF 2.0',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Validation Error', 'Company name is required.');
      return;
    }

    setLoading(true);
    try {
      const created = await createOrganization(formData);
      toast.success('Company Added', `Successfully established tenant for "${created.name}"`);
      onOrganizationCreated?.(created);
      onClose();
      setFormData({
        name: '',
        industry: 'Financial Technology (FinTech)',
        region: 'US-East (N. Virginia)',
        size: '250-1000',
        plan: 'Enterprise',
        primary_framework: 'NIST CSF 2.0',
      });
    } catch (err) {
      toast.error('Failed to Add Company', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Organization / Entity"
      description="Create a dedicated GRC tenant workspace for another company or business unit"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Input
          label="Company Legal Name *"
          placeholder="e.g. Apex Global Payments Ltd."
          icon={Building2}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Industry Vertical
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Financial Technology (FinTech)">Financial Technology (FinTech)</option>
              <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
              <option value="Enterprise SaaS & Cloud">Enterprise SaaS & Cloud</option>
              <option value="Defense & Aerospace">Defense & Aerospace</option>
              <option value="E-Commerce & Retail">E-Commerce & Retail</option>
              <option value="Energy & Utilities">Energy & Utilities</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Operating Region
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="US-East (N. Virginia)">US-East (N. Virginia)</option>
              <option value="US-West (Oregon)">US-West (Oregon)</option>
              <option value="EU-Central (Frankfurt)">EU-Central (Frankfurt)</option>
              <option value="EU-West (Ireland)">EU-West (Ireland)</option>
              <option value="AP-South (Mumbai)">AP-South (Mumbai)</option>
              <option value="AP-Southeast (Singapore)">AP-Southeast (Singapore)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Compliance Framework
            </label>
            <select
              value={formData.primary_framework}
              onChange={(e) => setFormData({ ...formData, primary_framework: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="NIST CSF 2.0">NIST CSF 2.0</option>
              <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
              <option value="SOC 2 Trust Services Criteria">SOC 2 Trust Services Criteria</option>
              <option value="CIS Controls v8">CIS Controls v8</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Company Size
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1-50">1 - 50 Employees</option>
              <option value="50-250">50 - 250 Employees</option>
              <option value="250-1000">250 - 1,000 Employees</option>
              <option value="1000+">1,000+ Enterprise</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Create Company Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}
