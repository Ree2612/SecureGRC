import React, { useState, useEffect, useCallback } from 'react';
import { getRisks } from '@/services/api';
import { RiskHeatmap } from '@/components/risk/RiskHeatmap';
import { RiskModal } from '@/components/risk/RiskModal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

export function RiskHeatmapPage() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRisks();
      setRisks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load risk data for heatmap generation.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Enterprise Risk Heatmap</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Visual 5×5 Likelihood vs. Impact matrix computed dynamically from active enterprise risk scenarios.
        </p>
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
        <RiskHeatmap risks={risks} onSelectRisk={handleSelectRisk} />
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
