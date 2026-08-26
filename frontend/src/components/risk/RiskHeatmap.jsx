import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiskHeatmap({ risks = [], onSelectRisk }) {
  const [selectedCell, setSelectedCell] = useState(null);

  // Likelihood: 1 (Rare) to 5 (Almost Certain)
  // Impact: 1 (Negligible) to 5 (Catastrophic)
  const likelihoodLabels = [
    { value: 5, label: '5 - Frequent / Almost Certain' },
    { value: 4, label: '4 - Likely' },
    { value: 3, label: '3 - Moderate' },
    { value: 2, label: '2 - Unlikely' },
    { value: 1, label: '1 - Rare' },
  ];

  const impactLabels = [
    { value: 1, label: '1 - Negligible' },
    { value: 2, label: '2 - Minor' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Major' },
    { value: 5, label: '5 - Critical' },
  ];

  const getCellSeverity = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score >= 16) return { level: 'Critical', bg: 'bg-red-500 hover:bg-red-600 text-white', lightBg: 'bg-red-50 text-red-700' };
    if (score >= 10) return { level: 'High', bg: 'bg-orange-500 hover:bg-orange-600 text-white', lightBg: 'bg-orange-50 text-orange-700' };
    if (score >= 5) return { level: 'Medium', bg: 'bg-amber-400 hover:bg-amber-500 text-slate-900', lightBg: 'bg-amber-50 text-amber-800' };
    return { level: 'Low', bg: 'bg-emerald-500 hover:bg-emerald-600 text-white', lightBg: 'bg-emerald-50 text-emerald-700' };
  };

  // Group risks by (likelihood, impact)
  const getRisksInCell = (likelihood, impact) => {
    return risks.filter(
      (r) => Number(r.likelihood) === Number(likelihood) && Number(r.impact) === Number(impact)
    );
  };

  const selectedCellRisks = selectedCell
    ? getRisksInCell(selectedCell.likelihood, selectedCell.impact)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 5x5 Matrix */}
      <Card className="lg:col-span-2">
        <CardHeader
          title="5×5 Quantitative Risk Matrix"
          description="Interactive distribution of inherent risks by Likelihood vs. Impact"
        />
        <CardContent className="pt-2 pb-6">
          <div className="flex">
            {/* Y-Axis Label */}
            <div className="flex items-center justify-center mr-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">
                Likelihood →
              </span>
            </div>

            {/* Matrix Grid */}
            <div className="flex-1 space-y-1.5">
              {likelihoodLabels.map((l) => (
                <div key={l.value} className="flex items-center gap-1.5">
                  {/* Row Label */}
                  <span className="w-6 text-center text-xs font-bold text-slate-500 shrink-0">
                    {l.value}
                  </span>

                  {/* 5 Columns */}
                  <div className="grid grid-cols-5 gap-1.5 flex-1">
                    {impactLabels.map((imp) => {
                      const cellRisks = getRisksInCell(l.value, imp.value);
                      const { level, bg } = getCellSeverity(l.value, imp.value);
                      const isSelected =
                        selectedCell?.likelihood === l.value && selectedCell?.impact === imp.value;
                      const hasRisks = cellRisks.length > 0;

                      return (
                        <button
                          key={`${l.value}-${imp.value}`}
                          type="button"
                          onClick={() => setSelectedCell({ likelihood: l.value, impact: imp.value, level })}
                          className={cn(
                            'h-14 rounded-md transition-all flex flex-col items-center justify-center relative border text-xs font-semibold',
                            hasRisks ? bg : 'bg-slate-50 hover:bg-slate-100 border-border text-slate-400',
                            isSelected && 'ring-2 ring-slate-900 ring-offset-2 scale-[1.03] z-10'
                          )}
                        >
                          {hasRisks ? (
                            <>
                              <span className="text-sm font-bold">{cellRisks.length}</span>
                              <span className="text-[9px] uppercase tracking-tighter opacity-85">
                                {cellRisks.length === 1 ? 'Risk' : 'Risks'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-normal">
                              {l.value}×{imp.value}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* X-Axis Numbers */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-6 shrink-0" />
                <div className="grid grid-cols-5 gap-1.5 flex-1">
                  {impactLabels.map((imp) => (
                    <span key={imp.value} className="text-center text-xs font-bold text-slate-500">
                      {imp.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* X-Axis Label */}
              <div className="text-center pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Impact Severity →
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Legend */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              <span>Critical (16–25)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500" />
              <span>High (10–15)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span>Medium (5–9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Low (1–4)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Cell Risk Inspector */}
      <Card className="flex flex-col justify-between">
        <CardHeader
          title={
            selectedCell
              ? `Coordinate (${selectedCell.likelihood}, ${selectedCell.impact}) Risks`
              : 'Risk Matrix Inspector'
          }
          description={
            selectedCell
              ? `Inherent Severity: ${selectedCell.level}`
              : 'Click any cell on the matrix to inspect active risks.'
          }
        />
        <CardContent className="pt-2 flex-1 overflow-y-auto max-h-[380px]">
          {!selectedCell ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Select a cell to view mapped threat scenarios.
            </div>
          ) : selectedCellRisks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No risks currently recorded at this coordinate.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCellRisks.map((risk) => (
                <div
                  key={risk.id}
                  onClick={() => onSelectRisk?.(risk)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-border rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge severity={risk.inherent_risk}>{risk.inherent_risk}</Badge>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Status: {risk.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-900 line-clamp-1">{risk.title}</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{risk.description}</p>
                  <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Owner: {risk.owner}</span>
                    <span className="text-primary-600 font-medium flex items-center gap-0.5">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
