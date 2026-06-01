'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../../lib/api';
import Navbar from '../../../components/layouts/Navbar';

export default function LeaseAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({
    activeLeases: 0,
    expiredLeases: 0,
    renewedLeases: 0,
    upcomingExpirations: 0,
  });
  const [alerts, setAlerts] = useState<any>({
    expiresIn7Days: [],
    expiresIn15Days: [],
    expiresIn30Days: [],
  });
  const [activeTab, setActiveTab] = useState<'7' | '15' | '30'>('30');

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchLeaseData();
  }, [router]);

  const fetchLeaseData = async () => {
    try {
      const data = await apiRequest('analytics/leases');
      if (data) {
        setMetrics(data.metrics || {});
        setAlerts(data.alerts || {});
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
        <div className="text-xl text-slate-400 animate-pulse">Loading lease lifecycle logs...</div>
      </div>
    );
  }

  const selectedList =
    activeTab === '7'
      ? alerts.expiresIn7Days
      : activeTab === '15'
      ? alerts.expiresIn15Days
      : alerts.expiresIn30Days;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Lease Expiry Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Audit active contracts, renewals, and upcoming expirations with critical timelines.</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
            Contract Lifecycle Audits
          </span>
        </section>

        {/* Dynamic Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Leases', val: metrics.activeLeases, desc: 'Contracts currently active', color: 'text-indigo-300' },
            { label: 'Renewed Leases', val: metrics.renewedLeases, desc: 'Renewed lease iterations', color: 'text-emerald-400' },
            { label: 'Expired Leases', val: metrics.expiredLeases, desc: 'Contracts historically expired', color: 'text-slate-400' },
            { label: 'Upcoming Expirations', val: metrics.upcomingExpirations, desc: 'Contracts expiring in 30 days', color: 'text-amber-400', highlight: true },
          ].map((card, i) => (
            <div key={i} className="glassmorphism rounded-xl p-6 shadow-md border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{card.label}</span>
              <div className="mt-4">
                <p className={`text-3xl font-extrabold ${card.color}`}>{card.val}</p>
                <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Tabbed Expiration Pipeline Alerts */}
        <section className="glassmorphism rounded-2xl p-6 md:p-8 shadow-xl flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
            <h3 className="text-lg font-bold">Upcoming Lease Expiry Pipeline</h3>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
              {[
                { label: 'Expires in 7 Days', key: '7', count: alerts.expiresIn7Days?.length || 0 },
                { label: 'Expires in 15 Days', key: '15', count: alerts.expiresIn15Days?.length || 0 },
                { label: 'Expires in 30 Days', key: '30', count: alerts.expiresIn30Days?.length || 0 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {selectedList && selectedList.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Lease Code</th>
                    <th className="p-4">Tenant Partner</th>
                    <th className="p-4">Unit Complex</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4 text-right">Time Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {selectedList.map((lease: any) => {
                    const diffDays = Math.ceil((new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={lease.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-mono text-slate-300 font-bold">{lease.leaseNumber}</td>
                        <td className="p-4 font-semibold text-slate-200">{lease.tenantName}</td>
                        <td className="p-4">{lease.unitNumber}</td>
                        <td className="p-4 text-slate-400">{new Date(lease.endDate).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            diffDays <= 7 
                              ? 'bg-red-950/60 text-red-400 border border-red-500/20' 
                              : diffDays <= 15 
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20' 
                              : 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/20'
                          }`}>
                            {diffDays <= 0 ? 'Expired' : `${diffDays} days left`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-sm text-slate-500">
                Zero active contract expirations flagged in the selected scope.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
