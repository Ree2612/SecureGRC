import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit2, Eye, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function RiskTable({ risks = [], onSelectRisk, onEditRisk }) {
  return (
    <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Risk Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Likelihood</TableHead>
            <TableHead className="text-center">Impact</TableHead>
            <TableHead>Inherent Risk</TableHead>
            <TableHead>Residual Risk</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow
              key={risk.id}
              clickable
              onClick={() => onSelectRisk?.(risk)}
            >
              <TableCell className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                {risk.title}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                {risk.category}
              </TableCell>
              <TableCell className="text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                {risk.likelihood}/5
              </TableCell>
              <TableCell className="text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                {risk.impact}/5
              </TableCell>
              <TableCell>
                <Badge severity={risk.inherent_risk}>{risk.inherent_risk}</Badge>
              </TableCell>
              <TableCell>
                <Badge severity={risk.residual_risk}>{risk.residual_risk}</Badge>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                {risk.owner}
              </TableCell>
              <TableCell>
                <Badge status={risk.status}>{risk.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Eye}
                    onClick={() => onSelectRisk?.(risk)}
                    title="View Details"
                  />
                  {onEditRisk && (
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Edit2}
                      onClick={() => onEditRisk?.(risk)}
                      title="Edit Risk"
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
