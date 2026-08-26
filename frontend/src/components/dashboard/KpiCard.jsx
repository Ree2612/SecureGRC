import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  statusVariant = 'default',
  badgeText,
}) {
  const getBadgeStyle = () => {
    switch (statusVariant) {
      case 'danger':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'primary':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className="p-4 hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center text-slate-500 border border-border">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badgeText && (
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded border', getBadgeStyle())}>
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>{subtitle}</span>
          {trend && (
            <span className={trendPositive ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
              {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
