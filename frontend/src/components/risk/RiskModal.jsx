import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createRisk, updateRisk } from '@/services/api';
import { useToast } from '@/lib/ToastContext';
import { useOutletContext } from 'react-router-dom';

const LIKELIHOOD_SCALES = {
  'ISO/IEC 27001:2022': [
    { value: 1, label: '1 - Low' },
    { value: 3, label: '3 - Medium' },
    { value: 5, label: '5 - High' },
  ],
  'SOC 2 Trust Services Criteria': [
    { value: 1, label: '1 - Unlikely' },
    { value: 3, label: '3 - Possible' },
    { value: 5, label: '5 - Probable' },
  ],
  'default': [
    { value: 1, label: '1 - Rare' },
    { value: 2, label: '2 - Unlikely' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Likely' },
    { value: 5, label: '5 - Almost Certain' },
  ]
};

const IMPACT_SCALES = {
  'ISO/IEC 27001:2022': [
    { value: 1, label: '1 - Low' },
    { value: 3, label: '3 - Medium' },
    { value: 5, label: '5 - High' },
  ],
  'SOC 2 Trust Services Criteria': [
    { value: 1, label: '1 - Low' },
    { value: 3, label: '3 - Moderate' },
    { value: 5, label: '5 - Severe' },
  ],
  'default': [
    { value: 1, label: '1 - Negligible' },
    { value: 2, label: '2 - Minor' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Major' },
    { value: 5, label: '5 - Critical' },
  ]
};

export function RiskModal({ isOpen, onClose, risk, onSaved }) {
  const toast = useToast();
  const context = useOutletContext();
  const selectedFramework = context?.selectedFramework;
  const isEditing = Boolean(risk?.id);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    likelihood: 3,
    impact: 3,
    inherent_risk: 'Medium',
    residual_risk: 'Low',
    status: 'Open',
    owner: '',
    threat_source: 'External Threat Actor',
    existing_controls: '',
    framework: selectedFramework || 'NIST CSF 2.0',
  });

  useEffect(() => {
    if (risk) {
      setFormData({
        title: risk.title || '',
        description: risk.description || '',
        category: risk.category || 'Infrastructure',
        likelihood: risk.likelihood || 3,
        impact: risk.impact || 3,
        inherent_risk: risk.inherent_risk || 'Medium',
        residual_risk: risk.residual_risk || 'Low',
        status: risk.status || 'Open',
        owner: risk.owner || '',
        threat_source: risk.threat_source || 'External Threat Actor',
        existing_controls: risk.existing_controls || '',
        framework: risk.framework || 'NIST CSF 2.0',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Infrastructure',
        likelihood: 3,
        impact: 3,
        inherent_risk: 'Medium',
        residual_risk: 'Low',
        status: 'Open',
        owner: '',
        threat_source: 'External Threat Actor',
        existing_controls: '',
        framework: selectedFramework || 'NIST CSF 2.0',
      });
    }
  }, [risk, isOpen, selectedFramework]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.owner) {
      toast.error('Validation Error', 'Risk title and owner are required.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateRisk(risk.id, formData);
        toast.success('Risk Updated', `Successfully updated "${formData.title}"`);
      } else {
        await createRisk(formData);
        toast.success('Risk Registered', `Successfully created "${formData.title}"`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error('Operation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Risk Details: ${risk.title}` : 'Register New Enterprise Risk'}
      description={
        isEditing
          ? 'Review quantitative risk parameters and current mitigation status'
          : 'Define risk scenario, likelihood, impact, and existing controls'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <Input
          label="Risk Title *"
          placeholder="e.g. Unauthenticated API Endpoints Exposing Telemetry"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Risk Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="Application Security">Application Security</option>
              <option value="Data Privacy">Data Privacy</option>
              <option value="Third-Party">Third-Party</option>
              <option value="Identity">Identity & Access</option>
              <option value="Compliance">Compliance & Regulatory</option>
              <option value="Operational">Operational</option>
            </select>
          </div>

          <Input
            label="Assigned Owner *"
            placeholder="e.g. Sarah Jenkins"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Risk Description & Scenario
          </label>
          <textarea
            rows={3}
            placeholder="Describe the threat scenario, vulnerability, and potential business disruption..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Assessment Framework
            </label>
            <select
              value={formData.framework}
              onChange={(e) => {
                const newFramework = e.target.value;
                const likelihoodOptions = LIKELIHOOD_SCALES[newFramework] || LIKELIHOOD_SCALES['default'];
                const impactOptions = IMPACT_SCALES[newFramework] || IMPACT_SCALES['default'];
                
                let newLikelihood = formData.likelihood;
                if (!likelihoodOptions.find(o => o.value === newLikelihood)) {
                   newLikelihood = likelihoodOptions.reduce((prev, curr) => Math.abs(curr.value - newLikelihood) < Math.abs(prev.value - newLikelihood) ? curr : prev).value;
                }
                
                let newImpact = formData.impact;
                if (!impactOptions.find(o => o.value === newImpact)) {
                   newImpact = impactOptions.reduce((prev, curr) => Math.abs(curr.value - newImpact) < Math.abs(prev.value - newImpact) ? curr : prev).value;
                }

                setFormData({ ...formData, framework: newFramework, likelihood: newLikelihood, impact: newImpact });
              }}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="NIST CSF 2.0">NIST CSF 2.0</option>
              <option value="ISO/IEC 27001:2022">ISO/IEC 27001:2022</option>
              <option value="CIS Controls v8">CIS Controls v8</option>
              <option value="SOC 2 Trust Services Criteria">SOC 2 TSC</option>
            </select>
          </div>
          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-border dark:border-slate-700 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Likelihood
            </label>
            <select
              value={formData.likelihood}
              onChange={(e) => setFormData({ ...formData, likelihood: Number(e.target.value) })}
              className="w-full rounded-md border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {(LIKELIHOOD_SCALES[formData.framework] || LIKELIHOOD_SCALES['default']).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Impact
            </label>
            <select
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
              className="w-full rounded-md border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {(IMPACT_SCALES[formData.framework] || IMPACT_SCALES['default']).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Residual Risk
            </label>
            <select
              value={formData.residual_risk}
              onChange={(e) => setFormData({ ...formData, residual_risk: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Risk Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>

          <Input
            label="Threat Source"
            placeholder="e.g. Cybercrime Group, Insider Threat"
            value={formData.threat_source}
            onChange={(e) => setFormData({ ...formData, threat_source: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Existing Controls & Safeguards
          </label>
          <textarea
            rows={2}
            placeholder="Current mitigation controls, monitoring alarms, or policies in place..."
            value={formData.existing_controls}
            onChange={(e) => setFormData({ ...formData, existing_controls: e.target.value })}
            className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {isEditing ? 'Save Changes' : 'Register Risk'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
