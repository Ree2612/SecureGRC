import React, { useState, useEffect, useCallback } from 'react';
import { getGaps, resolveGap, createRemediationForGap, createGap } from '@/services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { AlertTriangle, Plus, Search, CheckCircle2, ListTodo, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Gaps() {
  const toast = useToast();
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // New Gap Form
  const [newGap, setNewGap] = useState({
    title: '',
    framework: 'NIST CSF 2.0',
    control_code: '',
    business_impact: '',
    recommendation: '',
    owner: '',
    due_date: '2026-09-30',
  });

  const loadGaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await getGaps(params);
      setGaps(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load gap analysis.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadGaps();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadGaps]);

  const handleResolveGap = async (id, title) => {
    setActionLoadingId(id);
    try {
      await resolveGap(id);
      toast.success('Gap Resolved', `Successfully resolved "${title}"`);
      loadGaps();
    } catch (err) {
      toast.error('Action Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateRemediation = async (id, title) => {
    setActionLoadingId(id);
    try {
      const task = await createRemediationForGap(id);
      toast.success('Remediation Created', `Task created: "${task.task_name}"`);
      loadGaps();
    } catch (err) {
      toast.error('Action Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateGapSubmit = async (e) => {
    e.preventDefault();
    if (!newGap.title || !newGap.control_code || !newGap.owner) {
      toast.error('Validation Error', 'Title, Control Code, and Owner are required.');
      return;
    }

    try {
      await createGap(newGap);
      toast.success('Gap Logged', `Created gap for ${newGap.control_code}`);
      setIsCreateOpen(false);
      setNewGap({
        title: '',
        framework: 'NIST CSF 2.0',
        control_code: '',
        business_impact: '',
        recommendation: '',
        owner: '',
        due_date: '2026-09-30',
      });
      loadGaps();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Compliance Gap Analysis</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identify control deficiencies, evaluate business risk exposure, and trigger remediation tasks.
          </p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setIsCreateOpen(true)}>
          Identify New Gap
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search gap title, control code, owner..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open Gaps</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Gaps Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadGaps} />
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card">
          <TableSkeleton rows={6} cols={7} />
        </div>
      ) : gaps.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Compliance Gaps Found"
          description="All controls meet baseline framework requirements or no gaps match your filter."
          actionLabel="Log a Gap"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Control</TableHead>
                <TableHead>Gap Title & Framework</TableHead>
                <TableHead>Business Impact</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Owner & Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gaps.map((gap) => (
                <TableRow key={gap.id}>
                  <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {gap.control_code}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{gap.title}</div>
                    <div className="text-[11px] text-primary-700 dark:text-primary-400 font-medium mt-0.5">
                      {gap.framework}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300 max-w-xs text-xs leading-relaxed">
                    {gap.business_impact}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300 max-w-xs text-xs leading-relaxed">
                    {gap.recommendation}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{gap.owner}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Due: {gap.due_date}</div>
                  </TableCell>
                  <TableCell>
                    <Badge status={gap.status}>{gap.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {gap.status !== 'Resolved' && (
                        <>
                          <Button
                            size="xs"
                            variant="subtle"
                            icon={ListTodo}
                            isLoading={actionLoadingId === gap.id}
                            onClick={() => handleCreateRemediation(gap.id, gap.title)}
                            title="Generate a remediation task in tracker"
                          >
                            Remediate
                          </Button>
                          <Button
                            size="xs"
                            variant="secondary"
                            icon={CheckCircle2}
                            isLoading={actionLoadingId === gap.id}
                            onClick={() => handleResolveGap(gap.id, gap.title)}
                            title="Mark gap as resolved"
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                      {gap.status === 'Resolved' && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Gap Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Compliance Deficiency / Gap"
        description="Record an unfulfilled framework requirement and assign remediation timeline"
      >
        <form onSubmit={handleCreateGapSubmit} className="space-y-4 text-xs">
          <Input
            label="Gap Title *"
            placeholder="e.g. Unauthenticated IAM Role Access Reviews"
            value={newGap.title}
            onChange={(e) => setNewGap({ ...newGap, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Control Code *"
              placeholder="e.g. PR.AC-04"
              value={newGap.control_code}
              onChange={(e) => setNewGap({ ...newGap, control_code: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Framework
              </label>
              <select
                value={newGap.framework}
                onChange={(e) => setNewGap({ ...newGap, framework: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="NIST CSF 2.0">NIST CSF 2.0</option>
                <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
                <option value="CIS Controls v8">CIS Controls v8</option>
                <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assigned Lead Owner *"
              placeholder="e.g. Alexander Vance"
              value={newGap.owner}
              onChange={(e) => setNewGap({ ...newGap, owner: e.target.value })}
              required
            />
            <Input
              label="Target Due Date"
              type="date"
              value={newGap.due_date}
              onChange={(e) => setNewGap({ ...newGap, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Business & Audit Impact
            </label>
            <textarea
              rows={2}
              placeholder="Audit qualification risks, potential data breach vectors..."
              value={newGap.business_impact}
              onChange={(e) => setNewGap({ ...newGap, business_impact: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Remediation Recommendation
            </label>
            <textarea
              rows={2}
              placeholder="Technical implementation steps, automation tools, or policy revisions..."
              value={newGap.recommendation}
              onChange={(e) => setNewGap({ ...newGap, recommendation: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Log Gap
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
