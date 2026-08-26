import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while communicating with the SecureGRC API.',
  onRetry,
  className,
}) {
  return (
    <div className={`p-8 bg-red-50/50 rounded-lg border border-red-200 text-center flex flex-col items-center justify-center ${className || ''}`}>
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-semibold text-red-900">{title}</h4>
      <p className="text-xs text-red-700 max-w-md mt-1">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}
