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
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Compliance Framework Cross-Walk Mapping
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Harmonize compliance requirements across NIST CSF 2.0, ISO/IEC 27001:2022, CIS Controls v8, and SOC 2.
        </p>
      </div>

      {/* Framework Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((fw) => (
          <Card key={fw.id} className="p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Layers className="w-4 h-4" />
              <span className="font-mono text-xs font-bold">{fw.code}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{fw.name}</h4>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{fw.description}</p>
            <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Coverage</span>
              <span className="font-semibold text-slate-700">{fw.total_controls}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-border shadow-card flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Source Framework
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Source Frameworks</option>
            <option value="NIST CSF 2.0">NIST CSF 2.0</option>
            <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
            <option value="CIS Controls v8">CIS Controls v8</option>
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Target Framework
          </label>
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Target Frameworks</option>
            <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
            <option value="CIS Controls v8">CIS Controls v8</option>
            <option value="SOC 2 Trust Services Criteria">SOC 2 Trust Services Criteria</option>
          </select>
        </div>
      </div>

      {/* Mappings Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadMappings} />
      ) : loading ? (
        <div className="bg-white rounded-lg border border-border shadow-card">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : mappings.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No Cross-Walk Mappings Found"
          description="No framework mappings matched your selected criteria."
        />
      ) : (
        <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Control</TableHead>
                <TableHead className="text-center w-10">→</TableHead>
                <TableHead>Target Framework & Control</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Harmonization Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {m.source_control_code}
                    </div>
                    <div className="text-slate-700 font-medium truncate text-xs mt-0.5">
                      {m.source_control_name}
                    </div>
                    <div className="text-[11px] text-primary-700 mt-0.5">
                      {m.source_framework}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-slate-400">
                    <ArrowRight className="w-4 h-4 mx-auto" />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {m.target_control_code}
                    </div>
                    <div className="text-slate-700 font-medium truncate text-xs mt-0.5">
                      {m.target_control_name}
                    </div>
                    <div className="text-[11px] text-indigo-700 mt-0.5">
                      {m.target_framework}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.mapping_strength === 'Direct' ? 'success' : 'primary'}>
                      {m.mapping_strength}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-sm text-xs leading-relaxed">
                    {m.description}
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
