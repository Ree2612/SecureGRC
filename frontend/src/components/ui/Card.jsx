import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-card text-card-foreground transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className, children }) {
  return (
    <div className={cn('p-4 border-b border-border/80 dark:border-slate-800 flex items-start justify-between gap-4', className)}>
      <div>
        {title && (
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('p-4 border-t border-border/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
