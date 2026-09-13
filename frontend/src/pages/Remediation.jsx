import React, { useState, useEffect, useCallback } from 'react';
import {
  getRemediations,
  getRemediationMetrics,
  getRemediationFullDetails,
  createRemediation,
  createRisk,
  createAsset,
  getRisks,
  getAssets,
  submitRemediationForReview,
  verifyRemediation,
  rejectRemediation,
  updateRemediation,
  getUsers,
  uploadRemediationEvidence,
  deleteRemediationEvidence
} from '@/services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
  Send,
  XCircle,
  FileText,
  ShieldAlert,
  Server,
  History,
  AlertCircle,
  Upload,
  Trash2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Remediation() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState({
    active_remediations: 0,
    overdue: 0,
    due_this_week: 0,
    ready_for_review: 0,
    verified: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals & Action loading
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [verifyModalTask, setVerifyModalTask] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectModalTask, setRejectModalTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Detail Drawer State
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // New Task Form
  const [newTask, setNewTask] = useState({
    task_name: '',
    priority: 'High',
    owner: '',
    remediation_type: 'Technical',
    completion_criteria: '',
    notes: '',
    due_date: '2026-10-15',
    risk_id: '',
    asset_id: ''
  });

  const [customOwner, setCustomOwner] = useState('');
  const [customRiskTitle, setCustomRiskTitle] = useState('');
  const [customAssetName, setCustomAssetName] = useState('');

  const [availableRisks, setAvailableRisks] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [taskList, metricData] = await Promise.all([
        getRemediations(params),
        getRemediationMetrics()
      ]);
      setTasks(Array.isArray(taskList) ? taskList : []);
      if (metricData) setMetrics(metricData);
    } catch (err) {
      setError(err.message || 'Failed to fetch remediation tasks.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadData]);

  const loadContextOptions = useCallback(() => {
    getRisks().then(res => setAvailableRisks(Array.isArray(res) ? res : [])).catch(() => {});
    getAssets().then(res => setAvailableAssets(Array.isArray(res) ? res : [])).catch(() => {});
    getUsers().then(res => setAvailableUsers(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadContextOptions();
  }, [loadContextOptions]);

  const handleOpenDrawer = async (taskId) => {
    setSelectedTaskId(taskId);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const data = await getRemediationFullDetails(taskId);
      setDrawerData(data);
    } catch (err) {
      toast.error('Failed to load remediation details', err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleEvidenceFileUpload = async (file) => {
    if (!selectedTaskId || !file) return;
    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadRemediationEvidence(selectedTaskId, formData);
      toast.success('Evidence Uploaded', `Successfully attached "${file.name}"`);
      await handleOpenDrawer(selectedTaskId);
      loadData();
    } catch (err) {
      toast.error('Upload Failed', err.message);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleSubmitForReview = async (taskId, name) => {
    if (selectedTaskId === taskId && drawerData && drawerData.evidence && drawerData.evidence.length === 0) {
      toast.error('Evidence Required', 'Please upload at least one evidence document in Associated Evidence before submitting for review.');
      return;
    }
    setActionLoadingId(taskId);
    try {
      await submitRemediationForReview(taskId);
      toast.success('Submitted for Review', `Task "${name}" submitted to GRC reviewer.`);
      loadData();
      if (selectedTaskId === taskId) handleOpenDrawer(taskId);
    } catch (err) {
      toast.error('Submission Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalTask) return;
    if (!verifyModalTask.completion_criteria || !verifyModalTask.completion_criteria.trim()) {
      toast.error('Verification Blocked', 'No completion criteria defined. Cannot verify task until criteria are defined.');
      return;
    }

    setActionLoadingId(verifyModalTask.id);
    try {
      await verifyRemediation(verifyModalTask.id, { notes: verifyNotes });
      toast.success('Remediation Verified', `Task "${verifyModalTask.task_name}" verified & gap resolved.`);
      setVerifyModalTask(null);
      setVerifyNotes('');
      loadData();
      if (selectedTaskId === verifyModalTask.id) handleOpenDrawer(verifyModalTask.id);
    } catch (err) {
      toast.error('Verification Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalTask || !rejectionReason.trim()) {
      toast.error('Validation Error', 'A rejection reason is required.');
      return;
    }

    setActionLoadingId(rejectModalTask.id);
    try {
      await rejectRemediation(rejectModalTask.id, { rejection_reason: rejectionReason });
      toast.success('Changes Requested', `Task "${rejectModalTask.task_name}" returned to In Progress.`);
      setRejectModalTask(null);
      setRejectionReason('');
      loadData();
      if (selectedTaskId === rejectModalTask.id) handleOpenDrawer(rejectModalTask.id);
    } catch (err) {
      toast.error('Rejection Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const finalOwner = newTask.owner === 'other' ? customOwner.trim() : newTask.owner;

    if (!newTask.task_name || !finalOwner) {
      toast.error('Validation Error', 'Task Name and Lead Owner are required.');
      return;
    }

    try {
      let finalRiskId = newTask.risk_id;
      let finalAssetId = newTask.asset_id;

      if (newTask.risk_id === 'other') {
        if (!customRiskTitle.trim()) {
          toast.error('Validation Error', 'Custom risk title is required when Other is selected.');
          return;
        }
        const createdRisk = await createRisk({
          title: customRiskTitle.trim(),
          severity: 'High',
          category: 'Compliance Risk',
          owner: finalOwner,
          description: `Auto-registered from Remediation Task: ${newTask.task_name}`
        });
        finalRiskId = createdRisk.id;
      }

      if (newTask.asset_id === 'other') {
        if (!customAssetName.trim()) {
          toast.error('Validation Error', 'Custom asset name is required when Other is selected.');
          return;
        }
        const createdAsset = await createAsset({
          name: customAssetName.trim(),
          type: 'Infrastructure',
          criticality: 'High',
          owner: finalOwner,
          description: `Auto-registered from Remediation Task: ${newTask.task_name}`
        });
        finalAssetId = createdAsset.id;
      }

      await createRemediation({
        ...newTask,
        owner: finalOwner,
        risk_id: finalRiskId || null,
        asset_id: finalAssetId || null
      });

      toast.success('Task Created', `Created remediation task "${newTask.task_name}"`);
      setIsCreateOpen(false);
      setNewTask({
        task_name: '',
        priority: 'High',
        owner: '',
        remediation_type: 'Technical',
        completion_criteria: '',
        notes: '',
        due_date: '2026-10-15',
        risk_id: '',
        asset_id: ''
      });
      setCustomOwner('');
      setCustomRiskTitle('');
      setCustomAssetName('');
      loadData();
      loadContextOptions();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Remediation Action Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Status-driven lifecycle: Open → In Progress → Ready for Review → Verified / Rejected.
          </p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setIsCreateOpen(true)}>
          New Remediation Task
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Active Remediations</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">{metrics.active_remediations}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card">
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">Overdue</span>
          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">{metrics.overdue}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">Due This Week</span>
          <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">{metrics.due_this_week}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium block">Ready for Review</span>
          <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">{metrics.ready_for_review}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Verified</span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{metrics.verified}</span>
        </div>
      </div>

      {/* Status Filter Tabs & Search */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['', 'Open', 'In Progress', 'Ready for Review', 'Verified', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st || 'All Tasks'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex-1">
            <Input
              placeholder="Search task title, owner..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Remediation Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No Remediation Tasks Found"
          description="There are no active remediation actions matching your filter criteria."
          actionLabel="Create Remediation"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name & Carried Control</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Lead Owner</TableHead>
                <TableHead>Target Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const isOverdue = task.status !== 'Verified' && task.due_date && task.due_date < todayStr;
                return (
                  <TableRow key={task.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{task.task_name}</div>
                      {task.gap_title ? (
                        <div className="text-[11px] font-medium text-primary-600 dark:text-primary-400 mt-0.5 truncate">
                          Linked Gap: {task.gap_title} {task.control_code ? `(${task.control_code})` : ''}
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 italic">
                          Standalone / No linked gap
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge severity={task.priority}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px] text-xs">
                      {task.owner}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                          {task.due_date} {isOverdue && '(Overdue)'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge status={task.status}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={Eye}
                          onClick={() => handleOpenDrawer(task.id)}
                          title="View Remediation Details"
                        >
                          View Details
                        </Button>

                        {task.status === 'In Progress' && (
                          <Button
                            size="xs"
                            variant="subtle"
                            icon={Send}
                            isLoading={actionLoadingId === task.id}
                            onClick={() => handleSubmitForReview(task.id, task.task_name)}
                            title="Submit remediation for GRC verification review"
                          >
                            Submit Review
                          </Button>
                        )}

                        {task.status === 'Ready for Review' && (
                          <>
                            <Button
                              size="xs"
                              variant="secondary"
                              className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              icon={CheckCircle2}
                              onClick={() => setVerifyModalTask(task)}
                              title="Verify remediation"
                            >
                              Verify
                            </Button>
                            <Button
                              size="xs"
                              variant="secondary"
                              className="text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              icon={XCircle}
                              onClick={() => setRejectModalTask(task)}
                              title="Reject & request changes"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* REMEDIATION DETAIL DRAWER */}
      <Drawer
        isOpen={Boolean(selectedTaskId)}
        onClose={() => {
          setSelectedTaskId(null);
          setDrawerData(null);
        }}
        title="Remediation Task & Verification Context"
        subtitle="Detailed accountability, carried gap context, and audit history"
      >
        {drawerLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading task details...</div>
        ) : drawerData ? (
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <Badge status={drawerData.remediation.status}>{drawerData.remediation.status}</Badge>
                <Badge severity={drawerData.remediation.priority}>{drawerData.remediation.priority} Priority</Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{drawerData.remediation.task_name}</h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <div>Owner: <span className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.remediation.owner}</span></div>
                <div>Due Date: <span className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.remediation.due_date}</span></div>
              </div>
            </div>

            {/* Completion Criteria */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-500" />
                Completion Criteria (Required for Verification)
              </h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                {drawerData.remediation.completion_criteria && drawerData.remediation.completion_criteria.trim() ? (
                  drawerData.remediation.completion_criteria
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-sans italic">
                    No completion criteria defined. Task cannot be verified until completion criteria are defined.
                  </span>
                )}
              </div>
            </div>

            {/* Rejection Reason if present */}
            {drawerData.remediation.rejection_reason && (
              <div className="space-y-2">
                <h4 className="font-semibold text-rose-600 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900/50 pb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Rejection & Requested Changes
                </h4>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs">
                  {drawerData.remediation.rejection_reason}
                </div>
              </div>
            )}

            {/* Carried GRC Context Chain */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Carried GRC Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Linked Gap</span>
                  {drawerData.gap ? (
                    <div className="mt-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.gap.control_code}: {drawerData.gap.title}</div>
                      <Badge status={drawerData.gap.status} className="mt-1">{drawerData.gap.status}</Badge>
                    </div>
                  ) : <span className="text-amber-600 dark:text-amber-400 text-[11px] italic font-semibold block mt-1">Standalone / No linked gap</span>}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Linked Risk & Asset</span>
                  {drawerData.risk ? (
                    <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{drawerData.risk.title} ({drawerData.risk.severity})</div>
                  ) : <span className="text-slate-400 text-[11px] italic block">Risk: Not linked</span>}
                  {drawerData.asset ? (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Asset: {drawerData.asset.name}</div>
                  ) : <span className="text-slate-400 text-[11px] italic block">Asset: Not linked</span>}
                </div>
              </div>
            </div>

            {/* Evidence Files & Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border dark:border-slate-800 pb-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  Associated Evidence ({drawerData.evidence.length})
                </h4>
                <label className={`cursor-pointer inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 text-[11px] font-semibold hover:bg-primary-100 ${uploadingEvidence ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingEvidence ? 'Uploading...' : '+ Upload Evidence'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingEvidence}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEvidenceFileUpload(file);
                    }}
                  />
                </label>
              </div>

              {drawerData.evidence.length > 0 ? (
                <div className="space-y-1.5">
                  {drawerData.evidence.map((ev) => (
                    <div key={ev.id} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{ev.file_name}</div>
                          <div className="text-[10px] text-slate-400">Uploaded by {ev.uploaded_by}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Are you sure you want to delete evidence file "${ev.file_name}"?`)) return;
                          try {
                            await deleteRemediationEvidence(drawerData.remediation.id, ev.id);
                            toast.success('Evidence Deleted', `Removed "${ev.file_name}"`);
                            await handleOpenDrawer(drawerData.remediation.id);
                            loadData();
                          } catch (err) {
                            toast.error('Delete Failed', err.message);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Delete evidence document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] italic p-2 bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-border dark:border-slate-800 text-center">
                  No evidence items attached yet. Click "+ Upload Evidence" above to attach proof before submitting for review.
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" />
                Audit Trail & Status History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {drawerData.activities.map((act) => (
                  <div key={act.id} className="p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded border border-border dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</span>
                      <span>{formatDate(act.timestamp)}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{act.details}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">By {act.actor}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="pt-4 border-t border-border dark:border-slate-800 flex items-center justify-end gap-2">
              {drawerData.remediation.status === 'In Progress' && (
                <Button
                  size="sm"
                  icon={Send}
                  isLoading={actionLoadingId === drawerData.remediation.id}
                  onClick={() => handleSubmitForReview(drawerData.remediation.id, drawerData.remediation.task_name)}
                >
                  Submit for Verification
                </Button>
              )}
              {drawerData.remediation.status === 'Ready for Review' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-rose-600 dark:text-rose-400"
                    icon={XCircle}
                    onClick={() => setRejectModalTask(drawerData.remediation)}
                  >
                    Reject Changes
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    icon={CheckCircle2}
                    onClick={() => setVerifyModalTask(drawerData.remediation)}
                  >
                    Verify Remediation
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* VERIFY REMEDIATION MODAL */}
      <Modal
        isOpen={Boolean(verifyModalTask)}
        onClose={() => {
          setVerifyModalTask(null);
          setVerifyNotes('');
        }}
        title="Verify Remediation & Resolve Gap"
        description="Confirm that completion criteria and uploaded evidence satisfy compliance requirements."
      >
        {verifyModalTask && (
          <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">{verifyModalTask.task_name}</div>
              <div className="text-[11px] text-slate-500">Lead Owner: {verifyModalTask.owner}</div>
              
              <div className="mt-2 text-[11px]">
                <span className="font-semibold block text-slate-700 dark:text-slate-300">Completion Criteria:</span>
                {verifyModalTask.completion_criteria && verifyModalTask.completion_criteria.trim() ? (
                  <span className="text-slate-600 dark:text-slate-400">{verifyModalTask.completion_criteria}</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                    No completion criteria defined. Task cannot be verified until criteria are defined.
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reviewer Notes & Verification Decision
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Verified completion criteria and attached evidence. Gap resolved cleanly."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => { setVerifyModalTask(null); setVerifyNotes(''); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                isLoading={actionLoadingId === verifyModalTask.id}
                disabled={!verifyModalTask.completion_criteria || !verifyModalTask.completion_criteria.trim()}
              >
                Confirm Verification
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* REJECT REMEDIATION MODAL */}
      <Modal
        isOpen={Boolean(rejectModalTask)}
        onClose={() => setRejectModalTask(null)}
        title="Reject Remediation & Request Changes"
        description="Provide feedback to the lead owner explaining why evidence or work is incomplete."
      >
        {rejectModalTask && (
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-slate-100">{rejectModalTask.task_name}</div>
              <div className="text-[11px] text-slate-500">Lead Owner: {rejectModalTask.owner}</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Rejection / Requested Changes *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Evidence uploaded does not demonstrate completion of the quarterly access review."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setRejectModalTask(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={actionLoadingId === rejectModalTask.id}>
                Send Rejection Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* NEW REMEDIATION MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Standalone Remediation Action Item"
        description="Assign owner, set target completion timeline, and define completion criteria"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Task Name *"
            placeholder="e.g. Implement Automated Key Rotation for KMS"
            value={newTask.task_name}
            onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assigned Lead Owner *</label>
              <select
                value={newTask.owner}
                onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select owner...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role || u.email})</option>
                ))}
                <option value="other">✨ Other (Specify manually...)</option>
              </select>
              {newTask.owner === 'other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter lead owner name..."
                    value={customOwner}
                    onChange={(e) => setCustomOwner(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority Tier</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Link Risk (Optional)</label>
              <select
                value={newTask.risk_id}
                onChange={(e) => setNewTask({ ...newTask, risk_id: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No risk linked</option>
                {availableRisks.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.severity})</option>
                ))}
                <option value="other">✨ Other (Specify manually...)</option>
              </select>
              {newTask.risk_id === 'other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom risk title..."
                    value={customRiskTitle}
                    onChange={(e) => setCustomRiskTitle(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Link Asset (Optional)</label>
              <select
                value={newTask.asset_id}
                onChange={(e) => setNewTask({ ...newTask, asset_id: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No asset linked</option>
                {availableAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
                <option value="other">✨ Other (Specify manually...)</option>
              </select>
              {newTask.asset_id === 'other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom asset name..."
                    value={customAssetName}
                    onChange={(e) => setCustomAssetName(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remediation Type</label>
              <select
                value={newTask.remediation_type}
                onChange={(e) => setNewTask({ ...newTask, remediation_type: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Technical">Technical</option>
                <option value="Policy">Policy</option>
                <option value="Process">Process</option>
                <option value="Training">Training</option>
                <option value="Configuration">Configuration</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              label="Target Due Date"
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Completion Criteria *</label>
            <textarea
              rows={2}
              placeholder="Criteria required to consider this task completed and ready for verification..."
              value={newTask.completion_criteria}
              onChange={(e) => setNewTask({ ...newTask, completion_criteria: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

