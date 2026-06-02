'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface Analytics {
  totals: { present: number; absent: number; total: number };
  attendanceRate: number;
  monthlyTrend: { month: string; present: number; absent: number }[];
  topicFrequency: { topic: string; count: number }[];
  monthOverMonth: { current: number; previous: number; deltaPct: number };
}

interface AnalyticsTabProps {
  refreshKey: number;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981', '#14b8a6', '#3b82f6', '#eab308'];

export default function AnalyticsTab({ refreshKey }: AnalyticsTabProps) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch((e) => console.error('Analytics fetch failed:', e))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return <p className="text-center text-sm text-gray-400 py-12">Loading analytics…</p>;
  }
  if (!data) {
    return <p className="text-center text-sm text-gray-400 py-12">No analytics available</p>;
  }

  const pieData = [
    { name: 'Present', value: data.totals.present },
    { name: 'Absent', value: data.totals.absent },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance Rate</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{data.attendanceRate}%</p>
          <p className="text-xs text-gray-400 mt-1">across all sessions</p>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sessions</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{data.totals.total}</p>
          <p className="text-xs text-gray-400 mt-1">{data.totals.present} present · {data.totals.absent} absent</p>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Month</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{data.monthOverMonth.current}</p>
          <p className={`text-xs mt-1 font-semibold ${data.monthOverMonth.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {data.monthOverMonth.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(data.monthOverMonth.deltaPct)}% vs last month
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Month</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{data.monthOverMonth.previous}</p>
          <p className="text-xs text-gray-400 mt-1">present sessions</p>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="glass-strong rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Monthly Trend (last 12 months)</h3>
        <div className="w-full h-72">
          <ResponsiveContainer>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic frequency */}
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Topics</h3>
          {data.topicFrequency.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No topics recorded yet</p>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer>
                <BarChart data={data.topicFrequency} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="topic" stroke="#94a3b8" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {data.topicFrequency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Present vs Absent */}
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Present vs Absent</h3>
          {data.totals.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No sessions yet</p>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
