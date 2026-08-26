import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef(function Select(
  { label, error, className, id, children, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-slate-50 disabled:text-slate-400',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
});
