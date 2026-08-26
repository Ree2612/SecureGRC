import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function RiskDistribution({ data = [] }) {
  const totalRisks = data.reduce((acc, curr) => acc + curr.count, 0);

  const customColors = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#10B981',
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title="Risk Severity Distribution"
        description="Active risks categorized by inherent impact and likelihood"
      />
      <CardContent className="pt-2 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
          {/* Donut Chart */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="severity"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || customColors[entry.severity] || '#64748B'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <div className="text-xl font-bold text-slate-900 leading-none">{totalRisks}</div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 mt-1">Risks</div>
            </div>
          </div>

          {/* Breakdown Legend List */}
          <div className="space-y-2.5">
            {data.map((item) => {
              const pct = totalRisks > 0 ? Math.round((item.count / totalRisks) * 100) : 0;
              return (
                <div key={item.severity} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color || customColors[item.severity] }}
                    />
                    <span className="font-medium text-slate-700">{item.severity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{item.count}</span>
                    <span className="text-slate-400 text-[11px] w-8 text-right">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
