import React, { useState, useEffect, useCallback } from 'react';
import { getRisks } from '@/services/api';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { RiskModal } from '@/components/risk/RiskModal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useOutletContext } from 'react-router-dom';

export function RiskHeatmapPage() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedFramework = 'NIST CSF 2.0' } = useOutletContext() || {};

  const loadRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRisks({ framework: selectedFramework === 'All Frameworks' ? undefined : selectedFramework });
      setRisks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load risk data for heatmap generation.');
    } finally {
      setLoading(false);
    }
  }, [selectedFramework]);

  useEffect(() => {
    loadRisks();
  }, [loadRisks]);

  const handleSelectRisk = (risk) => {
    setSelectedRisk(risk);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Enterprise Risk Heatmap</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visual Likelihood vs. Impact matrix computed dynamically from active enterprise risk scenarios.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadRisks} />
      ) : loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      ) : (
        <RiskHeatmap 
          risks={risks} 
          onSelectRisk={handleSelectRisk} 
          matrixType={['ISO/IEC 27001:2022', 'SOC 2 Trust Services Criteria'].includes(selectedFramework) ? '3x3' : '5x5'}
        />
      )}

      <RiskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        risk={selectedRisk}
        onSaved={loadRisks}
      />
    </div>
  );
}
