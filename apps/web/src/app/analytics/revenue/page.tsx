'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../../lib/api';
import Navbar from '../../../components/layouts/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function RevenueAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    collectedRent: 0,
    pendingRent: 0,
    overdueRent: 0,
    collectionRate: 100,
  });
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchRevenueData();
  }, [router]);

  const fetchRevenueData = async () => {
    try {
      const data = await apiRequest('analytics/revenue');
      if (data) {
        setMetrics(data.metrics || {});
        setRevenueTrend(data.charts?.revenueTrend || []);
      }
    } catch {
      // Handle fallback silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Loading financial ledger logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Revenue Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Audit billing collections, late statements, and net financial trends.</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
            Automated Audits
          </span>
        </section>

        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Monthly Revenue', val: `₹${Number(metrics.monthlyRevenue).toLocaleString()}`, desc: 'Billing collected current month', color: 'text-indigo-300' },
            { label: 'Yearly Accumulation', val: `₹${Number(metrics.yearlyRevenue).toLocaleString()}`, desc: 'Accumulated billing current calendar year', color: 'text-indigo-300' },
            { label: 'Total Collections', val: `₹${Number(metrics.collectedRent).toLocaleString()}`, desc: 'All-time historical payments collected', color: 'text-emerald-400' },
            { label: 'Pending Statements', val: `₹${Number(metrics.pendingRent).toLocaleString()}`, desc: 'Current invoices awaiting verification', color: 'text-amber-400' },
            { label: 'Overdue Defaults', val: `₹${Number(metrics.overdueRent).toLocaleString()}`, desc: 'Total defaulted account ledger balances', color: 'text-red-400' },
            { label: 'Billing Collection Rate', val: `${metrics.collectionRate}%`, desc: 'Collected vs expected rent statement ratios', color: 'text-emerald-400', highlight: true },
          ].map((card, i) => (
            <div key={i} className="glassmorphism rounded-xl p-6 shadow-md border border-slate-800 hover:border-indigo-500/30 transition-all duration-200">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{card.label}</span>
              <div className="mt-4">
                <p className={`text-3xl font-extrabold ${card.color}`}>{card.val}</p>
                <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Charts Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expected vs Collected Revenue Trend */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Historical Billing Flow</h3>
            <div className="flex-1 w-full h-64 min-h-[250px]">
              {mounted && revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend />
                    <Line type="monotone" dataKey="expected" name="Expected Rent" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="collected" name="Collected Rent" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  {mounted ? 'No historical rental statements found.' : 'Rendering canvas...'}
                </div>
              )}
            </div>
          </div>

          {/* Overdue Debt Accumulation */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Monthly Overdue Debt</h3>
            <div className="flex-1 w-full h-64 min-h-[250px]">
              {mounted && revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="overdue" name="Outstanding Balance" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  {mounted ? 'No overdue balances found.' : 'Rendering canvas...'}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
