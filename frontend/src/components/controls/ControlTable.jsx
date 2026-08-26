import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Eye, Paperclip } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function ControlTable({ controls = [], onSelectControl }) {
  return (
    <div className="border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card">
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
              <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {control.control_code}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{control.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-primary-700 dark:text-primary-400">{control.function}</span>
                  <span>•</span>
                  <span className="truncate">{control.framework}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
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
              <TableCell className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                {control.owner}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{control.evidence_count || 0}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                {formatDate(control.last_assessed)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={Eye}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectControl?.(control);
                  }}
                  title="View Assessment"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
