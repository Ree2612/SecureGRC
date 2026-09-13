import React, { useState, useEffect, useCallback } from 'react';
import {
  getGaps,
  getGapFullDetails,
  resolveGap,
  createRemediationForGap,
  createGap,
  createRisk,
  createAsset,
  getFrameworkStandardControls,
  getRisks,
  getAssets,
  getUsers
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
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  ListTodo,
  Eye,
  ShieldAlert,
  Server,
  FileText,
  Clock,
  History,
  AlertCircle
} from 'lucide-react';
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

  // Detail Drawer State
  const [selectedGapId, setSelectedGapId] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Create Remediation Modal State (from Drawer/Gap)
  const [remediationModalGap, setRemediationModalGap] = useState(null);
  const [remediationForm, setRemediationForm] = useState({
    task_name: '',
    owner: '',
    priority: 'High',
    due_date: '',
    remediation_type: 'Technical',
    completion_criteria: '',
    notes: ''
  });
  const [remCustomOwner, setRemCustomOwner] = useState('');

  // New Gap Form State
  const [newGap, setNewGap] = useState({
    title: '',
    framework: 'NIST CSF 2.0',
    control_code: '',
    business_impact: '',
    recommendation: '',
    owner: '',
    due_date: '2026-09-30',
    risk_id: '',
    asset_id: ''
  });

  // Manual input states for "Other" selections
  const [customRiskTitle, setCustomRiskTitle] = useState('');
  const [customAssetName, setCustomAssetName] = useState('');
  const [gapCustomOwner, setGapCustomOwner] = useState('');

  const [availableRisks, setAvailableRisks] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableControls, setAvailableControls] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

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

  const loadContextOptions = useCallback(() => {
    getRisks().then(res => setAvailableRisks(Array.isArray(res) ? res : [])).catch(() => {});
    getAssets().then(res => setAvailableAssets(Array.isArray(res) ? res : [])).catch(() => {});
    getUsers().then(res => setAvailableUsers(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadContextOptions();
  }, [loadContextOptions]);

  useEffect(() => {
    if (isCreateOpen && newGap.framework) {
      getFrameworkStandardControls({ framework: newGap.framework }).then(data => {
        setAvailableControls(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [isCreateOpen, newGap.framework]);

  const handleOpenFindingDrawer = async (gapId) => {
    setSelectedGapId(gapId);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const data = await getGapFullDetails(gapId);
      setDrawerData(data);
    } catch (err) {
      toast.error('Failed to load gap details', err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenRemediationModal = (gapItem) => {
    setRemediationModalGap(gapItem);
    setRemediationForm({
      task_name: `Remediate ${gapItem.control_code}: ${gapItem.title}`,
      owner: gapItem.owner || '',
      priority: 'High',
      due_date: gapItem.due_date,
      remediation_type: 'Technical',
      completion_criteria: `Document evidence demonstrating control ${gapItem.control_code} is implemented and effective.`,
      notes: ''
    });
    setRemCustomOwner('');
  };

  const handleCreateRemediationSubmit = async (e) => {
    e.preventDefault();
    if (!remediationModalGap) return;

    const finalOwner = remediationForm.owner === 'other' ? remCustomOwner.trim() : remediationForm.owner;
    if (!finalOwner) {
      toast.error('Validation Error', 'Lead Owner is required.');
      return;
    }

    try {
      setActionLoadingId(remediationModalGap.id);
      const res = await createRemediationForGap(remediationModalGap.id, {
        ...remediationForm,
        owner: finalOwner
      });
      toast.success('Remediation Task Created', `Task: "${res.task_name}"`);
      setRemediationModalGap(null);
      loadGaps();
      if (selectedGapId === remediationModalGap.id) {
        handleOpenFindingDrawer(remediationModalGap.id);
      }
    } catch (err) {
      toast.error('Remediation Creation Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateGapSubmit = async (e) => {
    e.preventDefault();
    const finalOwner = newGap.owner === 'other' ? gapCustomOwner.trim() : newGap.owner;

    if (!newGap.title || !newGap.control_code || !finalOwner) {
      toast.error('Validation Error', 'Title, Control Code, and Owner are required.');
      return;
    }

    try {
      let finalRiskId = newGap.risk_id;
      let finalAssetId = newGap.asset_id;

      // Handle custom "Other" Risk creation
      if (newGap.risk_id === 'other') {
        if (!customRiskTitle.trim()) {
          toast.error('Validation Error', 'Custom risk title is required when Other is selected.');
          return;
        }
        const createdRisk = await createRisk({
          title: customRiskTitle.trim(),
          severity: 'High',
          category: 'Compliance Risk',
          owner: finalOwner,
          description: `Auto-registered from Gap: ${newGap.title}`
        });
        finalRiskId = createdRisk.id;
      }

      // Handle custom "Other" Asset creation
      if (newGap.asset_id === 'other') {
        if (!customAssetName.trim()) {
          toast.error('Validation Error', 'Custom asset name is required when Other is selected.');
          return;
        }
        const createdAsset = await createAsset({
          name: customAssetName.trim(),
          type: 'Infrastructure',
          criticality: 'High',
          owner: finalOwner,
          description: `Auto-registered from Gap: ${newGap.title}`
        });
        finalAssetId = createdAsset.id;
      }

      await createGap({
        ...newGap,
        owner: finalOwner,
        risk_id: finalRiskId || null,
        asset_id: finalAssetId || null
      });

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
        risk_id: '',
        asset_id: ''
      });
      setCustomRiskTitle('');
      setCustomAssetName('');
      setGapCustomOwner('');
      loadGaps();
      loadContextOptions();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Compliance Gap Analysis</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identify control deficiencies, inspect linked GRC context, and assign remediation workflows.
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
            <option value="Remediation In Progress">Remediation In Progress</option>
            <option value="Pending Verification">Pending Verification</option>
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
                <TableHead>Linked Context</TableHead>
                <TableHead>Owner & Timeline</TableHead>
                <TableHead>Remediation Status</TableHead>
                <TableHead>Gap Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gaps.map((gap) => {
                const isOverdue = gap.status !== 'Resolved' && gap.due_date && gap.due_date < todayStr;
                return (
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
                    <TableCell className="text-xs max-w-xs space-y-1">
                      {gap.risk_title ? (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium text-[11px] truncate">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{gap.risk_title}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Risk: Not linked</div>
                      )}
                      {gap.asset_name ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] truncate">
                          <Server className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{gap.asset_name}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Asset: Not linked</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{gap.owner}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                          Due: {gap.due_date} {isOverdue && '(Overdue)'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {gap.remediation_status ? (
                        <Badge status={gap.remediation_status}>{gap.remediation_status}</Badge>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic font-medium">No remediation linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge status={gap.status}>{gap.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={Eye}
                          onClick={() => handleOpenFindingDrawer(gap.id)}
                          title="View complete GRC finding drawer"
                        >
                          View Finding
                        </Button>
                        {!gap.remediation_id && gap.status !== 'Resolved' && (
                          <Button
                            size="xs"
                            variant="subtle"
                            icon={ListTodo}
                            onClick={() => handleOpenRemediationModal(gap)}
                            title="Assign remediation task"
                          >
                            Remediate
                          </Button>
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

      {/* VIEW FINDING DRAWER */}
      <Drawer
        isOpen={Boolean(selectedGapId)}
        onClose={() => {
          setSelectedGapId(null);
          setDrawerData(null);
        }}
        title="GRC Finding & Audit Context"
        subtitle="Connected chain of Gap, Risk, Control, Asset, Remediation, and Evidence"
      >
        {drawerLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading GRC finding details...</div>
        ) : drawerData ? (
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Header / Summary Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-primary-600 dark:text-primary-400">
                  {drawerData.gap.control_code}
                </span>
                <div className="flex items-center gap-2">
                  <Badge status={drawerData.gap.status}>{drawerData.gap.status}</Badge>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{drawerData.gap.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{drawerData.gap.framework}</p>
            </div>

            {/* Finding Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-500" />
                Finding Details
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-md border border-border dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px] block">Assigned Lead Owner</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{drawerData.gap.owner}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Target Due Date</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{drawerData.gap.due_date}</span>
                </div>
              </div>
              {drawerData.gap.business_impact && (
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium mb-1">Business & Audit Impact</span>
                  <p className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded border border-border dark:border-slate-800 leading-relaxed text-slate-600 dark:text-slate-300">
                    {drawerData.gap.business_impact}
                  </p>
                </div>
              )}
              {drawerData.gap.recommendation && (
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium mb-1">Remediation Recommendation</span>
                  <p className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded border border-border dark:border-slate-800 leading-relaxed text-slate-600 dark:text-slate-300">
                    {drawerData.gap.recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Related GRC Context */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Related GRC Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Linked Risk</span>
                  {drawerData.risk ? (
                    <div className="mt-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{drawerData.risk.title}</div>
                      <Badge status={drawerData.risk.severity} className="mt-1">{drawerData.risk.severity}</Badge>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic mt-1 block">Not linked</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Linked Asset</span>
                  {drawerData.asset ? (
                    <div className="mt-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{drawerData.asset.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{drawerData.asset.type}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic mt-1 block">Not linked</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Control Implementation</span>
                  {drawerData.control ? (
                    <div className="mt-1">
                      <Badge status={drawerData.control.implementation_status}>{drawerData.control.implementation_status}</Badge>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{drawerData.control.framework}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic mt-1 block">Not linked</span>
                  )}
                </div>
              </div>
            </div>

            {/* Remediation Lifecycle */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-emerald-500" />
                  Remediation Task
                </span>
                {!drawerData.remediation && (
                  <Button size="xs" icon={Plus} onClick={() => handleOpenRemediationModal(drawerData.gap)}>
                    Create Remediation
                  </Button>
                )}
              </h4>

              {drawerData.remediation ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{drawerData.remediation.task_name}</span>
                    <Badge status={drawerData.remediation.status}>{drawerData.remediation.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>Owner: <span className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.remediation.owner}</span></div>
                    <div>Priority: <span className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.remediation.priority}</span></div>
                    <div>Type: <span className="font-semibold text-slate-900 dark:text-slate-100">{drawerData.remediation.remediation_type}</span></div>
                  </div>
                  {drawerData.remediation.completion_criteria ? (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border border-border dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-semibold">Completion Criteria:</span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">{drawerData.remediation.completion_criteria}</p>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-200 italic">
                      No completion criteria defined.
                    </div>
                  )}
                  {drawerData.remediation.rejection_reason && (
                    <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900/50">
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Rejection Feedback:
                      </span>
                      <p className="text-rose-700 dark:text-rose-300 text-xs mt-0.5">{drawerData.remediation.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded border border-dashed border-border dark:border-slate-800">
                  No active remediation task created yet.
                </div>
              )}
            </div>

            {/* Evidence Files */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1">
                Uploaded Evidence ({drawerData.evidence.length})
              </h4>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] italic">No evidence uploaded yet.</div>
              )}
            </div>

            {/* Audit / Activity Trail */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 border-b border-border dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" />
                Audit Trail & History
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
          </div>
        ) : null}
      </Drawer>

      {/* CREATE REMEDIATION MODAL (AUTO-CARRIED CONTEXT) */}
      <Modal
        isOpen={Boolean(remediationModalGap)}
        onClose={() => setRemediationModalGap(null)}
        title="Create Connected Remediation Task"
        description="Auto-filled from Gap finding context to ensure traceability."
      >
        <form onSubmit={handleCreateRemediationSubmit} className="space-y-4 text-xs">
          {remediationModalGap && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-border dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Carried Context:</span>
              <div className="font-bold text-slate-900 dark:text-slate-100">{remediationModalGap.control_code}: {remediationModalGap.title}</div>
              <div className="text-[11px] text-slate-500">Framework: {remediationModalGap.framework} | Lead Owner: {remediationModalGap.owner}</div>
            </div>
          )}

          <Input
            label="Task Name *"
            value={remediationForm.task_name}
            onChange={(e) => setRemediationForm({ ...remediationForm, task_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Responsible Lead Owner *</label>
              <select
                value={remediationForm.owner}
                onChange={(e) => setRemediationForm({ ...remediationForm, owner: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select Lead Owner</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
                <option value="other">Other (Specify manually...)</option>
              </select>
              {remediationForm.owner === 'other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter lead owner name..."
                    value={remCustomOwner}
                    onChange={(e) => setRemCustomOwner(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select
                value={remediationForm.priority}
                onChange={(e) => setRemediationForm({ ...remediationForm, priority: e.target.value })}
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remediation Type</label>
              <select
                value={remediationForm.remediation_type}
                onChange={(e) => setRemediationForm({ ...remediationForm, remediation_type: e.target.value })}
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
              value={remediationForm.due_date}
              onChange={(e) => setRemediationForm({ ...remediationForm, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Completion Criteria * (Defines what "fixed" means)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Quarterly privileged access review completed and approval evidence uploaded."
              value={remediationForm.completion_criteria}
              onChange={(e) => setRemediationForm({ ...remediationForm, completion_criteria: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Optional Notes</label>
            <textarea
              rows={2}
              placeholder="Implementation instructions, dependencies, or scope guidelines..."
              value={remediationForm.notes}
              onChange={(e) => setRemediationForm({ ...remediationForm, notes: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setRemediationModalGap(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoadingId === remediationModalGap?.id}>
              Assign Remediation
            </Button>
          </div>
        </form>
      </Modal>

      {/* NEW GAP LOGGING MODAL */}
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Framework</label>
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
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Link Risk (Optional)</label>
              <select
                value={newGap.risk_id}
                onChange={(e) => setNewGap({ ...newGap, risk_id: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No risk linked</option>
                {availableRisks.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.severity})</option>
                ))}
                <option value="other"> Other (Specify manually...)</option>
              </select>
              {newGap.risk_id === 'other' && (
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
                value={newGap.asset_id}
                onChange={(e) => setNewGap({ ...newGap, asset_id: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No asset linked</option>
                {availableAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
                <option value="other"> Other (Specify manually...)</option>
              </select>
              {newGap.asset_id === 'other' && (
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assigned Lead Owner *</label>
              <select
                value={newGap.owner}
                onChange={(e) => setNewGap({ ...newGap, owner: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select Lead Owner</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
                <option value="other">Other (Specify manually...)</option>
              </select>
              {newGap.owner === 'other' && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter lead owner name..."
                    value={gapCustomOwner}
                    onChange={(e) => setGapCustomOwner(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <Input
              label="Target Due Date"
              type="date"
              value={newGap.due_date}
              onChange={(e) => setNewGap({ ...newGap, due_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Business & Audit Impact</label>
            <textarea
              rows={2}
              placeholder="Audit qualification risks, potential data breach vectors..."
              value={newGap.business_impact}
              onChange={(e) => setNewGap({ ...newGap, business_impact: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remediation Recommendation</label>
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
