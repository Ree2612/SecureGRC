import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom text-xs text-left border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead
      className={cn(
        'bg-slate-50 dark:bg-slate-900 border-b border-border dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody
      className={cn('divide-y divide-border dark:divide-slate-800/80 bg-white dark:bg-slate-900', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ className, clickable = false, children, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        clickable && 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th
      className={cn('px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300', className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn('px-4 py-3 text-slate-800 dark:text-slate-200 align-middle', className)}
      {...props}
    >
      {children}
    </td>
  );
}
