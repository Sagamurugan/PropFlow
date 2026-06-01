'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchReportPreview();
  }, [router]);

  const fetchReportPreview = async () => {
    try {
      const data = await apiRequest('reports/monthly');
      if (data) {
        setReportData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      // Retrieve JWT accessToken from local storage
      const token = localStorage.getItem('pf_access_token');
      
      // Let's resolve the correct absolute API URL (which is http://localhost:4000/api under dev)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      const response = await fetch(`${apiUrl}/reports/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileExt = format === 'excel' ? 'csv' : 'txt';
      const filename = `propflow_report_${new Date().getFullYear()}_${new Date().getMonth() + 1}.${fileExt}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Report export failed. Check server connection.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Scaffolding report modules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reporting Engine</h1>
            <p className="text-slate-400 text-sm mt-1">Compile and export monthly financial statements, occupancy audits, and repair logs.</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
            Offline Exporters
          </span>
        </section>

        {reportData ? (
          <div className="space-y-8">
            {/* Live Data Summary Preview */}
            <div className="glassmorphism rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800/80 space-y-6">
              <h3 className="text-xl font-extrabold border-b border-slate-800 pb-4 text-center">
                Monthly Operations Overview ({reportData.monthName})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">1. Occupancy Comps</span>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/50 space-y-1">
                    <p className="text-sm text-slate-400">Occupancy Rate: <strong className="text-slate-200 font-mono">{reportData.occupancy.occupancyRate}%</strong></p>
                    <p className="text-xs text-slate-400">Occupied Units: {reportData.occupancy.occupiedUnits} / {reportData.occupancy.totalUnits}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">2. Financial Statements</span>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/50 space-y-1">
                    <p className="text-sm text-slate-400">Collection Rate: <strong className="text-slate-200 font-mono">{reportData.finance.collectionRate}%</strong></p>
                    <p className="text-xs text-slate-400">Collected: ₹${reportData.finance.collected.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">3. Repair Dispatches</span>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/50 space-y-1">
                    <p className="text-sm text-slate-400">Resolved Requests: <strong className="text-slate-200 font-mono">{reportData.maintenance.resolvedTickets}</strong></p>
                    <p className="text-xs text-slate-400">Open Tickets: {reportData.maintenance.openTickets} / {reportData.maintenance.totalTickets}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Trigger Board */}
            <div className="glassmorphism rounded-2xl p-6 shadow-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-lg font-bold">Download Spreadsheet Reports</h4>
                <p className="text-slate-400 text-xs">Instantly build downloadable financial sheets for offline management.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={exporting}
                  onClick={() => triggerDownload('excel')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 text-sm font-semibold rounded-lg shadow transition-colors border border-slate-700/50 flex items-center gap-2"
                >
                  📊 Download Excel (CSV)
                </button>
                <button
                  disabled={exporting}
                  onClick={() => triggerDownload('pdf')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  📄 Download PDF (TXT)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glassmorphism rounded-2xl p-12 text-center text-slate-500 shadow-md">
            No dynamic performance statements logged in this monthly boundary context.
          </div>
        )}
      </main>
    </div>
  );
}
