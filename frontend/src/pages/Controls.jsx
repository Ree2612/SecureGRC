import React, { useState, useEffect, useCallback } from 'react';
import { getControls } from '@/services/api';
import { ControlTable } from '@/components/controls/ControlTable';
import { ControlDetailsModal } from '@/components/controls/ControlDetailsModal';
import { Input } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search, ShieldCheck, Filter } from 'lucide-react';

export function Controls() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [framework, setFramework] = useState('');
  const [functionFilter, setFunctionFilter] = useState('');
  const [implStatus, setImplStatus] = useState('');
  const [effectiveness, setEffectiveness] = useState('');

  // Modal
  const [selectedControl, setSelectedControl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadControls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (framework) params.framework = framework;
      if (functionFilter) params.function = functionFilter;
      if (implStatus) params.implementation_status = implStatus;
      if (effectiveness) params.effectiveness = effectiveness;

      const data = await getControls(params);
      setControls(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch controls.');
    } finally {
      setLoading(false);
    }
  }, [search, framework, functionFilter, implStatus, effectiveness]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadControls();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadControls]);

  const handleSelectControl = (control) => {
    setSelectedControl(control);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Control Assessment & Verification
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluate operational implementation, measure design effectiveness, and attach compliance audit evidence.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-border shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search code, requirement, owner..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Frameworks</option>
              <option value="NIST CSF 2.0">NIST CSF 2.0</option>
              <option value="ISO/IEC 27001">ISO/IEC 27001</option>
              <option value="CIS Controls v8">CIS Controls v8</option>
            </select>
          </div>

          <div>
            <select
              value={functionFilter}
              onChange={(e) => setFunctionFilter(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Functions</option>
              <option value="Govern">Govern</option>
              <option value="Identify">Identify</option>
              <option value="Protect">Protect</option>
              <option value="Detect">Detect</option>
              <option value="Respond">Respond</option>
              <option value="Recover">Recover</option>
            </select>
          </div>

          <div>
            <select
              value={implStatus}
              onChange={(e) => setImplStatus(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Implementations</option>
              <option value="Implemented">Implemented</option>
              <option value="Partially Implemented">Partially Implemented</option>
              <option value="Not Implemented">Not Implemented</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>

          <div>
            <select
              value={effectiveness}
              onChange={(e) => setEffectiveness(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Effectiveness</option>
              <option value="Effective">Effective</option>
              <option value="Partially Effective">Partially Effective</option>
              <option value="Ineffective">Ineffective</option>
              <option value="Untested">Untested</option>
            </select>
          </div>
        </div>

        {(search || framework || functionFilter || implStatus || effectiveness) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
            <span className="text-slate-500">
              Showing {controls.length} matching controls
            </span>
            <button
              onClick={() => {
                setSearch('');
                setFramework('');
                setFunctionFilter('');
                setImplStatus('');
                setEffectiveness('');
              }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Control Table Content */}
      {error ? (
        <ErrorState message={error} onRetry={loadControls} />
      ) : loading ? (
        <div className="bg-white rounded-lg border border-border shadow-card">
          <TableSkeleton rows={8} cols={8} />
        </div>
      ) : controls.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Controls Found"
          description="No controls matched your search or filtering criteria."
        />
      ) : (
        <ControlTable
          controls={controls}
          onSelectControl={handleSelectControl}
        />
      )}

      {/* Details & Assessment Modal */}
      <ControlDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        control={selectedControl}
        onUpdated={loadControls}
      />
    </div>
  );
}
