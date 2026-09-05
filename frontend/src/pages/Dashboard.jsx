import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  getKpis,
  getNistCoverage,
  getRiskDistribution,
  getControlImplementation,
  getActivities,
} from '@/services/api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RiskDistribution } from '@/components/dashboard/RiskDistribution';
import { ComplianceCoverage } from '@/components/dashboard/ComplianceCoverage';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ListTodo,
  Award,
  Activity,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

export function Dashboard() {
  const context = useOutletContext() || {};
  const selectedOrg = context.selectedOrg;
  const selectedFramework = context.selectedFramework;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState(null);
  const [nistCoverage, setNistCoverage] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [controlImplementation, setControlImplementation] = useState([]);
  const [activities, setActivities] = useState([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { framework: selectedFramework || 'NIST CSF 2.0' };
      const [
        kpisData,
        nistData,
        riskDistData,
        ctrlImplData,
        actData,
      ] = await Promise.all([
        getKpis(params),
        getNistCoverage(params),
        getRiskDistribution(params),
        getControlImplementation(params),
        getActivities(15),
      ]);

      setKpis(kpisData);
      setNistCoverage(nistData || []);
      setRiskDistribution(riskDistData || []);
      setControlImplementation(ctrlImplData || []);
      setActivities(actData || []);
    } catch (err) {
      setError(err.message || 'Failed to load executive dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  }, [selectedFramework]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, selectedOrg]);

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Dashboard Telemetry Unavailable"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  if (loading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Security Posture & Compliance Health
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise assessment against {selectedFramework || 'NIST CSF 2.0'} for {selectedOrg?.name || 'Your Organization'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Continuous Audit Active
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          title="Overall Risk Score"
          value={`${kpis.overall_risk}/100`}
          subtitle="Quantified inherent threat"
          icon={ShieldAlert}
          badgeText={kpis.overall_risk_label}
          statusVariant={
            kpis.overall_risk > 70 ? 'danger' : kpis.overall_risk > 40 ? 'warning' : 'success'
          }
        />
        <KpiCard
          title="Open Risks"
          value={kpis.open_risks}
          subtitle="Pending mitigation"
          icon={AlertTriangle}
          badgeText={kpis.open_risks > 0 ? 'Action Needed' : 'Controlled'}
          statusVariant={kpis.open_risks > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          title="Control Coverage"
          value={`${kpis.control_coverage}%`}
          subtitle="Implemented safeguards"
          icon={ShieldCheck}
          badgeText={`${kpis.control_coverage}%`}
          statusVariant={kpis.control_coverage >= 80 ? 'success' : 'primary'}
        />
        <KpiCard
          title="Open Gaps"
          value={kpis.open_gaps}
          subtitle="Audit compliance gaps"
          icon={AlertTriangle}
          badgeText={kpis.open_gaps === 0 ? 'Zero Gaps' : 'Action Required'}
          statusVariant={kpis.open_gaps === 0 ? 'success' : 'danger'}
        />
        <KpiCard
          title="Remediation"
          value={`${kpis.remediation_progress}%`}
          subtitle="Average task progress"
          icon={ListTodo}
          badgeText={`${kpis.remediation_progress}% done`}
          statusVariant="primary"
        />
        <KpiCard
          title="Compliance Score"
          value={`${kpis.compliance_score}%`}
          subtitle="Audit readiness index"
          icon={Award}
          badgeText="Verified"
          statusVariant={kpis.compliance_score >= 80 ? 'success' : 'primary'}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistribution data={riskDistribution} />
        <ComplianceCoverage
          data={nistCoverage}
          framework={selectedFramework || 'NIST CSF 2.0'}
        />
      </div>

      {/* Activity Timeline Section */}
      <ActivityFeed activities={activities} />
    </div>
  );
}
