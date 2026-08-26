import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-border shadow-card overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, title, description, action, ...props }) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-border flex items-center justify-between', className)}
      {...props}
    >
      {title ? (
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-5 py-3 bg-slate-50/50 border-t border-border flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
