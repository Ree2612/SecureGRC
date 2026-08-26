import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { updateControlAssessment, addControlEvidence, getControlEvidence } from '@/services/api';
import { useToast } from '@/lib/ToastContext';
import { formatDate } from '@/lib/utils';
import { FileText, Paperclip, Plus, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export function ControlDetailsModal({ isOpen, onClose, control, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const [formData, setFormData] = useState({
    implementation_status: 'Implemented',
    effectiveness: 'Effective',
    notes: '',
    owner: '',
  });

  const [newEvidence, setNewEvidence] = useState({
    title: '',
    file_name: '',
    file_type: 'PDF',
  });

  useEffect(() => {
    if (control) {
      setFormData({
        implementation_status: control.implementation_status || 'Implemented',
        effectiveness: control.effectiveness || 'Effective',
        notes: control.notes || '',
        owner: control.owner || '',
      });

      // Load evidence
      getControlEvidence(control.id)
        .then((data) => {
          if (Array.isArray(data)) setEvidenceList(data);
        })
        .catch(() => setEvidenceList(control.evidence || []));
    }
  }, [control, isOpen]);

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!control) return;

    setLoading(true);
    try {
      await updateControlAssessment(control.id, formData);
      toast.success('Assessment Updated', `Successfully updated control ${control.control_code}`);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error('Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!newEvidence.title || !newEvidence.file_name) {
      toast.error('Validation Error', 'Title and File Name are required.');
      return;
    }

    try {
      const created = await addControlEvidence(control.id, newEvidence);
      setEvidenceList((prev) => [created, ...prev]);
      setShowAddEvidence(false);
      setNewEvidence({ title: '', file_name: '', file_type: 'PDF' });
      toast.success('Evidence Attached', `Uploaded ${newEvidence.file_name}`);
      onUpdated?.();
    } catch (err) {
      toast.error('Upload Failed', err.message);
    }
  };

  if (!control) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${control.control_code} — ${control.name}`}
      description={`${control.framework} • Function: ${control.function} • Category: ${control.category}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs">
        {/* Requirement Box */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-border dark:border-slate-700 space-y-1.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
            Formal Framework Requirement
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {control.requirement}
          </p>
        </div>

        {/* Assessment Form */}
        <form onSubmit={handleAssessmentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Implementation Status
              </label>
              <select
                value={formData.implementation_status}
                onChange={(e) => setFormData({ ...formData, implementation_status: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Implemented">Implemented</option>
                <option value="Partially Implemented">Partially Implemented</option>
                <option value="Not Implemented">Not Implemented</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Operational Effectiveness
              </label>
              <select
                value={formData.effectiveness}
                onChange={(e) => setFormData({ ...formData, effectiveness: e.target.value })}
                className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Effective">Effective</option>
                <option value="Partially Effective">Partially Effective</option>
                <option value="Ineffective">Ineffective</option>
                <option value="Untested">Untested</option>
              </select>
            </div>

            <Input
              label="Control Owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Auditor & Implementation Assessment Notes
            </label>
            <textarea
              rows={3}
              placeholder="Detail control mechanisms, automation tools, frequency of verification, or exceptions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-md border border-border dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" isLoading={loading} size="sm">
              Save Assessment
            </Button>
          </div>
        </form>

        {/* Evidence Section */}
        <div className="pt-4 border-t border-border dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Compliance Evidence Artifacts ({evidenceList.length})
              </h4>
            </div>
            <Button
              size="xs"
              variant="outline"
              icon={Plus}
              onClick={() => setShowAddEvidence(!showAddEvidence)}
            >
              {showAddEvidence ? 'Cancel' : 'Attach Evidence'}
            </Button>
          </div>

          {/* New Evidence Form */}
          {showAddEvidence && (
            <form
              onSubmit={handleAddEvidenceSubmit}
              className="p-3.5 bg-blue-50/50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Evidence Title *"
                  placeholder="e.g. Q1 2026 MFA Audit Log Export"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                  required
                />
                <Input
                  label="File Name / Document Reference *"
                  placeholder="e.g. okta_mfa_telemetry.pdf"
                  value={newEvidence.file_name}
                  onChange={(e) => setNewEvidence({ ...newEvidence, file_name: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="xs">
                  Upload & Link Artifact
                </Button>
              </div>
            </form>
          )}

          {/* Evidence List */}
          {evidenceList.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-border dark:border-slate-700 rounded-lg text-center text-slate-400 dark:text-slate-500 text-xs">
              No evidence artifacts attached to this control yet.
            </div>
          ) : (
            <div className="space-y-2">
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-border dark:border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{ev.title}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-2">
                        <span>{ev.file_name}</span>
                        <span>•</span>
                        <span>Uploaded by {ev.uploaded_by}</span>
                        <span>•</span>
                        <span>{formatDate(ev.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">{ev.file_type || 'PDF'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
