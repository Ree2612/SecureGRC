import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export function ComplianceCoverage({ data = [], framework = 'NIST CSF 2.0' }) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title={`${framework} Implementation Coverage`}
        description="Assessment status across core functions"
      />
      <CardContent className="pt-2 pb-5 space-y-4">
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No framework coverage data available.
          </div>
        ) : (
          data.map((item) => (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ({item.implemented} of {item.total} controls)
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.percentage >= 80
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : item.percentage >= 50
                      ? 'bg-primary-600 dark:bg-primary-500'
                      : item.percentage >= 25
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-red-500 dark:bg-red-400'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
