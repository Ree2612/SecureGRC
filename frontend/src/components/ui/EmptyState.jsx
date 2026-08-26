import React from 'react';
import { ShieldAlert, FolderSearch } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No records found',
  description = 'There are no items matching your current filters or query.',
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-dashed border-border ${className || ''}`}>
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-border text-slate-400 mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
