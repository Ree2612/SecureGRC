import React from 'react';
import { cn, getSeverityColor, getStatusColor } from '@/lib/utils';

export function Badge({ children, variant = 'default', severity, status, className, ...props }) {
  let variantStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (severity) {
    variantStyles = getSeverityColor(severity);
  } else if (status) {
    variantStyles = getStatusColor(status);
  } else {
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'success':
        variantStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        variantStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        variantStyles = 'bg-red-50 text-red-700 border-red-200';
        break;
      case 'neutral':
      default:
        variantStyles = 'bg-slate-50 text-slate-600 border-slate-200';
        break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-normal tracking-wide',
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
