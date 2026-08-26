import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Eye, Paperclip } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function ControlTable({ controls = [], onSelectControl }) {
  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Control ID</TableHead>
            <TableHead>Control Name & Function</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Implementation</TableHead>
            <TableHead>Effectiveness</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Last Assessed</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((control) => (
            <TableRow
              key={control.id}
              clickable
              onClick={() => onSelectControl?.(control)}
            >
              <TableCell className="font-mono font-bold text-slate-900">
                {control.control_code}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="font-semibold text-slate-900 truncate">{control.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-primary-700">{control.function}</span>
                  <span>•</span>
                  <span className="truncate">{control.framework}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 truncate max-w-[140px]">
                {control.category}
              </TableCell>
              <TableCell>
                <Badge status={control.implementation_status}>
                  {control.implementation_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge status={control.effectiveness}>
                  {control.effectiveness}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600 truncate max-w-[120px]">
                {control.owner}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{control.evidence?.length || 0}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-500 text-[11px]">
                {formatDate(control.last_assessed)}
              </TableCell>
              <TableCell className="text-right">
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => onSelectControl?.(control)}
                  >
                    Assess
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
