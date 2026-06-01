'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../../lib/api';
import Navbar from '../../../components/layouts/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function MaintenanceAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    openTickets: 0,
    resolvedTickets: 0,
    averageResolutionTime: 0,
    criticalTickets: 0,
    slaCompliance: 100,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [ticketTrend, setTicketTrend] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchMaintenanceData();
  }, [router]);

  const fetchMaintenanceData = async () => {
    try {
      const data = await apiRequest('analytics/maintenance');
      if (data) {
        setMetrics(data.metrics || {});
        setCategoryBreakdown(data.charts?.categoryBreakdown || []);
        setTicketTrend(data.charts?.ticketTrend || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Loading operations data...</div>
      </div>
    );
  }

  const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Maintenance Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Audit ticket categories, average dispatch resolution times, and SLA metrics.</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
            Operations Dispatches
          </span>
        </section>

        {/* Dynamic Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Open Service Tickets', val: metrics.openTickets, desc: 'Awaiting repairs' },
            { label: 'Resolved Tickets', val: metrics.resolvedTickets, desc: 'Completed operations' },
            { label: 'Average Resolution Time', val: `${metrics.averageResolutionTime}h`, desc: 'Average ticket closure hours' },
            { label: 'Critical Service Flags', val: metrics.criticalTickets, desc: 'Critical alerts active', color: 'text-red-400' },
            { label: 'SLA Resolution Compliance', val: `${metrics.slaCompliance}%`, desc: 'Resolved within threshold', color: 'text-emerald-400', highlight: true },
          ].map((card, i) => (
            <div key={i} className="glassmorphism rounded-xl p-6 shadow-md border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{card.label}</span>
              <div className="mt-4">
                <p className={`text-3xl font-extrabold ${card.color || 'text-indigo-300'}`}>{card.val}</p>
                <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Visual Charts Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown (Pie) */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Tickets Category Breakdown</h3>
            <div className="flex-1 w-full h-64 min-h-[250px] flex items-center justify-center">
              {mounted && categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No ticket categories logged.
                </div>
              )}
            </div>
          </div>

          {/* Ticket Dispatch Trend (Bar) */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Monthly Ticket Inflow Trends</h3>
            <div className="flex-1 w-full h-64 min-h-[250px]">
              {mounted && ticketTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="requests" name="Service Requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  {mounted ? 'No historical dispatches found.' : 'Rendering canvas...'}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
