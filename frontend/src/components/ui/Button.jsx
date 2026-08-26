import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-md';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-subtle focus:ring-primary-500 border border-transparent',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-border shadow-subtle focus:ring-slate-400',
    outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-border focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-subtle focus:ring-red-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
    subtle: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 focus:ring-blue-400',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
