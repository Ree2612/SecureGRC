import React, { useState, useEffect, useCallback } from 'react';
import { getReports, generateReport, createReport } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { FileText, Download, Play, Plus, Clock, CheckCircle2, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

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

  const handleGenerate = async (id, name) => {
    setGeneratingId(id);
    try {
      const updated = await generateReport(id);
      toast.success('Report Generated', `Compiled "${name}" successfully.`);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      toast.error('Generation Failed', err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newReport.name) {
      toast.error('Validation Error', 'Report Name is required.');
      return;
    }

    try {
      await createReport(newReport);
      toast.success('Report Created', `Template "${newReport.name}" created.`);
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
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Compliance & Audit Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compile board-ready executive risk summaries, technical audit artifacts, and framework gap assessments.
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
        <div className="bg-white rounded-lg border border-border shadow-card">
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
        <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Framework Scope</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-semibold text-slate-900 max-w-sm truncate">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                      <span className="truncate">{report.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {report.framework}
                  </TableCell>
                  <TableCell className="text-slate-600">
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
                  <TableCell className="text-slate-500 text-xs">
                    {report.generated_at ? formatDate(report.generated_at) : 'Not yet generated'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="xs"
                        variant={report.status === 'Generated' ? 'outline' : 'primary'}
                        icon={Play}
                        isLoading={generatingId === report.id}
                        onClick={() => handleGenerate(report.id, report.name)}
                      >
                        {report.status === 'Generated' ? 'Re-Generate' : 'Generate'}
                      </Button>
                      {report.status === 'Generated' && (
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={Download}
                          onClick={() =>
                            toast.info('Downloading Report', `Downloading ${report.name}...`)
                          }
                        >
                          PDF
                        </Button>
                      )}
                    </div>
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
        description="Configure report parameters for automated generation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <Input
            label="Report Title *"
            placeholder="e.g. Q2 2026 Board Cybersecurity Risk Summary"
            value={newReport.name}
            onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Framework Scope
              </label>
              <select
                value={newReport.framework}
                onChange={(e) => setNewReport({ ...newReport, framework: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="NIST CSF 2.0">NIST CSF 2.0</option>
                <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
                <option value="SOC 2 Trust Services Criteria">SOC 2 Trust Services Criteria</option>
                <option value="CIS Controls v8">CIS Controls v8</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Report Format
              </label>
              <select
                value={newReport.type}
                onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Executive Summary">Executive Summary</option>
                <option value="Gap Analysis">Gap Analysis</option>
                <option value="Technical Audit">Technical Audit</option>
                <option value="SOC 2 Readiness">SOC 2 Readiness</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
