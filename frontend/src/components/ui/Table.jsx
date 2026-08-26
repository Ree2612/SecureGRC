import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ children, className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-xs border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }) {
  return (
    <thead className={cn('bg-slate-50 border-b border-border text-slate-600 font-semibold uppercase tracking-wider text-[11px]', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }) {
  return (
    <tbody className={cn('divide-y divide-border/75 bg-white text-slate-700', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, clickable = false, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        clickable ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }) {
  return (
    <th className={cn('px-4 py-3 font-medium', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}
