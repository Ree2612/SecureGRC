import React, { useState, useEffect, useCallback } from 'react';
import { getReports, downloadReport, createReport } from '@/services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { FileText, Download, Plus, CheckCircle2, Shield, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // New Report Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    framework: 'NIST CSF 2.0',
    type: 'Executive Summary',
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDownload = async (id, name) => {
    setDownloadingId(id);
    try {
      await downloadReport(id, name);
      toast.success('Report Downloaded', `Successfully exported "${name}"`);
      // Reload reports to update Generated status
      loadReports();
    } catch (err) {
      toast.error('Download Failed', err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newReport.name.trim()) {
      toast.error('Validation Error', 'Report Name is required.');
      return;
    }

    try {
      const created = await createReport(newReport);
      toast.success('Report Template Created', `Template "${newReport.name}" added.`);
      setIsCreateOpen(false);
      setNewReport({
        name: '',
        framework: 'NIST CSF 2.0',
        type: 'Executive Summary',
      });
      loadReports();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Compliance & Audit Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export board-ready executive risk summaries, technical audit artifacts, and framework gap assessments.
          </p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setIsCreateOpen(true)}>
          New Report Template
        </Button>
      </div>

      {/* Reports Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadReports} />
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card">
          <TableSkeleton rows={5} cols={6} />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Reports Generated"
          description="There are currently no compliance or risk reports."
          actionLabel="Create Report"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Framework Scope</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead className="text-right">Export Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100 max-w-sm truncate">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                      <span className="truncate">{report.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                    {report.framework}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {report.type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === 'Generated'
                          ? 'success'
                          : report.status === 'Draft'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                    {report.generated_at ? formatDate(report.generated_at) : 'Ready to export'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="primary"
                      icon={Download}
                      isLoading={downloadingId === report.id}
                      onClick={() => handleDownload(report.id, report.name)}
                    >
                      Download Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Report Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Compliance Report Template"
        description="Configure framework scope and document structure for automated generation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Report Title *"
            placeholder="e.g. Q3 2026 Executive Cybersecurity & Risk Summary"
            value={newReport.name}
            onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Framework Scope
              </label>
              <select
                value={newReport.framework}
                onChange={(e) => setNewReport({ ...newReport, framework: e.target.value })}
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
                Report Format
              </label>
              <select
                value={newReport.type}
                onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Executive Summary">Executive Summary</option>
                <option value="Gap Analysis">Gap Analysis</option>
                <option value="Technical Audit">Technical Audit</option>
                <option value="SOC 2 Readiness">SOC 2 Readiness</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
