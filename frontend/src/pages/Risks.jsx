import React, { useState, useEffect, useCallback } from 'react';
import { getRisks, deleteRisk } from '@/services/api';
import { RiskTable } from '@/components/risk/RiskTable';
import { RiskModal } from '@/components/risk/RiskModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/lib/ToastContext';
import { Plus, Search, Filter, ShieldAlert, SlidersHorizontal } from 'lucide-react';

export function Risks() {
  const toast = useToast();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  // Modal
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (severity) params.severity = severity;
      if (status) params.status = status;

      const data = await getRisks(params);
      setRisks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch risks.');
    } finally {
      setLoading(false);
    }
  }, [search, category, severity, status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadRisks();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadRisks]);

  const handleOpenCreate = () => {
    setSelectedRisk(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (risk) => {
    setSelectedRisk(risk);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Risk Register</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify, assess, and track inherent and residual cybersecurity risks across your organization.
          </p>
        </div>
        <Button icon={Plus} onClick={handleOpenCreate} size="sm">
          Register Risk
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-border shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search risk scenario, title, owner..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Application Security">Application Security</option>
              <option value="Data Privacy">Data Privacy</option>
              <option value="Third-Party">Third-Party</option>
              <option value="Identity">Identity & Access</option>
              <option value="Compliance">Compliance & Regulatory</option>
              <option value="Operational">Operational</option>
            </select>
          </div>

          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Inherent Severities</option>
              <option value="Critical">Critical Severity</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
        </div>

        {(search || category || severity || status) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
            <span className="text-slate-500">
              Showing {risks.length} filtered {risks.length === 1 ? 'risk' : 'risks'}
            </span>
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setSeverity('');
                setStatus('');
              }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Content Table / Skeletons */}
      {error ? (
        <ErrorState message={error} onRetry={loadRisks} />
      ) : loading ? (
        <div className="bg-white rounded-lg border border-border shadow-card">
          <TableSkeleton rows={6} cols={8} />
        </div>
      ) : risks.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Risks Found"
          description="No enterprise risks match your current filter parameters or none have been registered."
          actionLabel="Register First Risk"
          onAction={handleOpenCreate}
        />
      ) : (
        <RiskTable
          risks={risks}
          onSelectRisk={handleOpenEdit}
          onEditRisk={handleOpenEdit}
        />
      )}

      {/* Risk Create / Edit Modal */}
      <RiskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        risk={selectedRisk}
        onSaved={loadRisks}
      />
    </div>
  );
}
