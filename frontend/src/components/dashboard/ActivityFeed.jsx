import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatTimeAgo } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle2, UserCheck, Activity } from 'lucide-react';

export function ActivityFeed({ activities = [] }) {
  const getActionIcon = (action) => {
    if (action.includes('Control') || action.includes('Assessed')) {
      return <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (action.includes('Risk')) {
      return <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />;
    }
    if (action.includes('Report')) {
      return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (action.includes('Resolved') || action.includes('Remediation')) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
    return <Activity className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title="Audit & Activity Timeline"
        description="Immutable record of security posture modifications and assessments"
      />
      <CardContent className="pt-2 pb-4">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {activities.slice(0, 7).map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-50 border border-border flex items-center justify-center shrink-0 mt-0.5">
                  {getActionIcon(item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {item.actor} <span className="font-normal text-slate-500">• {item.action}</span>
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                    {item.target}
                  </p>
                  {item.details && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
