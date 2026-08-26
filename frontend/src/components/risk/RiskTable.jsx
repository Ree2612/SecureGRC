import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Edit2, Eye, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function RiskTable({ risks = [], onSelectRisk, onEditRisk }) {
  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
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
              <TableCell className="font-semibold text-slate-900 max-w-xs truncate">
                {risk.title}
              </TableCell>
              <TableCell className="text-slate-600 font-medium">
                {risk.category}
              </TableCell>
              <TableCell className="text-center font-mono font-medium text-slate-700">
                {risk.likelihood}/5
              </TableCell>
              <TableCell className="text-center font-mono font-medium text-slate-700">
                {risk.impact}/5
              </TableCell>
              <TableCell>
                <Badge severity={risk.inherent_risk}>{risk.inherent_risk}</Badge>
              </TableCell>
              <TableCell>
                <Badge severity={risk.residual_risk}>{risk.residual_risk}</Badge>
              </TableCell>
              <TableCell className="text-slate-600 truncate max-w-[130px]">
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
                    title="View Details"
                    onClick={() => onSelectRisk?.(risk)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    title="Edit Risk"
                    onClick={() => onEditRisk?.(risk)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
