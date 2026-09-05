import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { createControl } from '@/services/api';

export function AddControlModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    control_code: '',
    name: '',
    requirement: '',
    framework: 'NIST CSF 2.0',
    function: 'Identify',
    category: 'Asset Management',
    owner: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createControl(formData);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create control.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-modal w-full max-w-lg border border-border dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Add Custom Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-100 dark:border-red-800/30">
              {error}
            </div>
          )}
          
          <form id="add-control-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Control Code</label>
                <Input
                  required
                  placeholder="e.g., ID.AM-01"
                  value={formData.control_code}
                  onChange={(e) => setFormData({ ...formData, control_code: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Framework</label>
                <select
                  required
                  className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.framework}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                >
                  <option value="NIST CSF 2.0">NIST CSF 2.0</option>
                  <option value="ISO/IEC 27001">ISO/IEC 27001</option>
                  <option value="CIS Controls v8">CIS Controls v8</option>
                  <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
                  <option value="Custom">Custom Framework</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
              <Input
                required
                placeholder="Control Title"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requirement / Description</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Detailed control requirement..."
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Function / Domain</label>
                <Input
                  required
                  placeholder="e.g., Identify, Access Control"
                  value={formData.function}
                  onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <Input
                  required
                  placeholder="e.g., Asset Management"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Owner</label>
              <Input
                placeholder="e.g., Jane Doe, SecOps"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-control-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Control'}
          </button>
        </div>
      </div>
    </div>
  );
}
