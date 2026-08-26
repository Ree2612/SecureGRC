import React, { useState, useEffect, useCallback } from 'react';
import { getFrameworks, getFrameworkMappings } from '@/services/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Network, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export function FrameworkMapping() {
  const [frameworks, setFrameworks] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sourceFilter, setSourceFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const loadMappings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fwData, mapData] = await Promise.all([
        getFrameworks(),
        getFrameworkMappings({
          ...(sourceFilter ? { source_framework: sourceFilter } : {}),
          ...(targetFilter ? { target_framework: targetFilter } : {}),
        }),
      ]);
      setFrameworks(Array.isArray(fwData) ? fwData : []);
      setMappings(Array.isArray(mapData) ? mapData : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch framework cross-walk mappings.');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, targetFilter]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Compliance Framework Cross-Walk Mapping
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Harmonize compliance requirements across NIST CSF 2.0, ISO/IEC 27001:2022, CIS Controls v8, and SOC 2.
        </p>
      </div>

      {/* Framework Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((fw) => (
          <Card key={fw.id} className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
              <Layers className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{fw.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{fw.description}</p>
            <div className="mt-3 pt-2 border-t border-border/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Version: {fw.version}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{fw.total_controls} Controls</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source Standard
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Source Standards</option>
              <option value="NIST CSF 2.0">NIST CSF 2.0</option>
              <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
              <option value="CIS Controls v8">CIS Controls v8</option>
              <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Standard
            </label>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Target Standards</option>
              <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
              <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
              <option value="CIS Controls v8">CIS Controls v8</option>
              <option value="NIST CSF 2.0">NIST CSF 2.0</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Mappings Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadMappings} />
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-card">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : mappings.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No Mappings Found"
          description="No cross-walk mappings match your selected standards."
        />
      ) : (
        <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Control</TableHead>
                <TableHead>Source Standard</TableHead>
                <TableHead className="text-center w-12"></TableHead>
                <TableHead>Target Standard</TableHead>
                <TableHead>Target Control</TableHead>
                <TableHead>Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((map) => (
                <TableRow key={map.id}>
                  <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {map.source_control_code}
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                    {map.source_framework}
                  </TableCell>
                  <TableCell className="text-center text-slate-400 dark:text-slate-500">
                    <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                    {map.target_framework}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary-700 dark:text-primary-400">
                    {map.target_control_code}
                  </TableCell>
                  <TableCell>
                    <Badge variant={map.mapping_type === 'Direct / Full' ? 'success' : 'primary'}>
                      {map.mapping_type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
