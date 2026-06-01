'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../../lib/api';
import Navbar from '../../../components/layouts/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function OccupancyAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    reservedUnits: 0,
    occupancyRate: 0,
  });
  const [propertyComparison, setPropertyComparison] = useState<any[]>([]);
  const [selectedPropertyScore, setSelectedPropertyScore] = useState<any | null>(null);
  const [fetchingScore, setFetchingScore] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchOccupancyData();
  }, [router]);

  const fetchOccupancyData = async () => {
    try {
      const data = await apiRequest('analytics/occupancy');
      if (data) {
        setMetrics(data.metrics || {});
        setPropertyComparison(data.propertyComparison || []);
        
        // Auto-fetch score for the first property if exists
        if (data.propertyComparison?.length > 0) {
          fetchPropertyScore(data.propertyComparison[0].id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyScore = async (id: string) => {
    setFetchingScore(true);
    try {
      const scoreData = await apiRequest(`analytics/properties/${id}/score`);
      if (scoreData) {
        setSelectedPropertyScore(scoreData);
      }
    } catch {
      setSelectedPropertyScore(null);
    } finally {
      setFetchingScore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Loading occupancy logs...</div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];
  const pieData = [
    { name: 'Occupied', value: metrics.occupiedUnits },
    { name: 'Vacant', value: metrics.vacantUnits },
    { name: 'Reserved', value: metrics.reservedUnits },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Occupancy Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Track vacant complexes, rental distribution, and calculated performance scores.</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
            Realtime Space Allocation
          </span>
        </section>

        {/* KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Total Units Portfolio', val: metrics.totalUnits, desc: 'Apartments registered' },
            { label: 'Occupied Spaces', val: metrics.occupiedUnits, desc: 'Leases active & occupied', color: 'text-emerald-400' },
            { label: 'Vacant Spaces', val: metrics.vacantUnits, desc: 'Unleased and available', color: 'text-red-400' },
            { label: 'Reserved Spaces', val: metrics.reservedUnits, desc: 'Deposits paid & on hold', color: 'text-amber-400' },
            { label: 'Portfolio Occupancy %', val: `${metrics.occupancyRate}%`, desc: 'Average occupied ratio', color: 'text-emerald-400', highlight: true },
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
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Occupancy Rate Comparisons */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Property Occupancy Comparison</h3>
            <div className="flex-1 w-full h-64 min-h-[250px]">
              {mounted && propertyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={propertyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="occupancyRate" name="Occupancy Rate" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  {mounted ? 'No active properties to compare.' : 'Rendering canvas...'}
                </div>
              )}
            </div>
          </div>

          {/* Unit Status Breakdown Ring */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold mb-4">Space Ratio Distribution</h3>
            <div className="flex-1 w-full h-64 min-h-[250px] flex items-center justify-center">
              {mounted && pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No spaces registered.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Property Performance Score Engine (0-100 Calc) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Comps Comparison Table */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl lg:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">Property Comps Portfolio</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Property Complex</th>
                  <th className="p-4">Total Units</th>
                  <th className="p-4">Occupied</th>
                  <th className="p-4">Vacant</th>
                  <th className="p-4">Occupancy</th>
                  <th className="p-4 text-right">Intel Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {propertyComparison.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => fetchPropertyScore(p.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-200">{p.name}</td>
                    <td className="p-4">{p.totalUnits}</td>
                    <td className="p-4 text-emerald-400">{p.occupiedUnits}</td>
                    <td className="p-4 text-slate-400">{p.vacantUnits}</td>
                    <td className="p-4 font-semibold text-indigo-300">{p.occupancyRate}%</td>
                    <td className="p-4 text-right font-mono font-bold text-indigo-400">Click to calculate</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Calculation Card */}
          <div className="glassmorphism rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Property Performance Score</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/20">
                  Intel Core
                </span>
              </h3>

              {fetchingScore ? (
                <div className="py-20 text-center text-sm text-slate-400 animate-pulse">
                  Computing operational vectors...
                </div>
              ) : selectedPropertyScore ? (
                <div className="space-y-6 mt-6">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase">{selectedPropertyScore.propertyName}</p>
                    <p className="text-6xl font-extrabold gradient-text font-mono">{selectedPropertyScore.score}<span className="text-sm font-semibold text-slate-500">/100</span></p>
                    <p className="text-xs text-indigo-300 mt-1">Deterministic non-AI SaaS scoring evaluation</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Occupancy Allocation (35%)</span>
                      <span className="font-bold text-slate-200">{selectedPropertyScore.breakdown.occupancyRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Revenue Ledger Collection (35%)</span>
                      <span className="font-bold text-slate-200">{selectedPropertyScore.breakdown.collectionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Maintenance SLA Dispatch (15%)</span>
                      <span className="font-bold text-slate-200">{selectedPropertyScore.breakdown.maintenanceSLA}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Lease Agreement Stability (15%)</span>
                      <span className="font-bold text-slate-200">{selectedPropertyScore.breakdown.leaseStability}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-slate-500">
                  Select a property complex table row to trigger computational analytics.
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-6 pt-3 border-t border-slate-800 leading-normal">
              Formula: (0.35 × Occupancy) + (0.35 × Collection) + (0.15 × SLA Compliance) + (0.15 × Lease Stability)
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
