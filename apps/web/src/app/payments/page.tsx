'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  DollarSign, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  X, 
  CheckCircle, 
  AlertCircle,
  SlidersHorizontal,
  User,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Percent,
  FileSpreadsheet,
  Zap
} from 'lucide-react';

function PaymentsContent() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Pay Form State
  const [amountPaid, setAmountPaid] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [reference, setReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate Form State
  const [month, setMonth] = useState('2026-07');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session);
    fetchPayments();
  }, [router]);

  const fetchPayments = async () => {
    try {
      const data = await apiRequest('payments');
      setRecords(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (rec: any) => {
    setSelectedRecord(rec);
    setAmountPaid(Number(rec.balance));
    setLateFee(Number(rec.lateFee));
    setShowPayForm(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`payments/${selectedRecord.id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({
          amountPaid: Number(amountPaid),
          lateFee: Number(lateFee),
          reference,
          receiptUrl: receiptUrl || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Recorded Rent Payment: ₹${amountPaid} from ${selectedRecord.tenant.firstName} ${selectedRecord.tenant.lastName}`,
            entityType: 'PAYMENT',
            entityId: selectedRecord.id,
            performedBy: 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently
      }

      setShowPayForm(false);
      setSelectedRecord(null);
      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('payments/generate', {
        method: 'POST',
        body: JSON.stringify({ month }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Generated Rent Ledger Invoices for ${month}`,
            entityType: 'PAYMENT',
            entityId: month,
            performedBy: 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently
      }

      setShowGenerateForm(false);
      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Ledger generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerOverdueCheck = async () => {
    try {
      await apiRequest('payments/trigger-overdue-check', { method: 'POST' });
      fetchPayments();
      alert('Overdue rent records successfully updated and owner notified.');
    } catch {
      // Fallback
    }
  };

  // Client side filtering (SaaS high-speed responsive experience)
  const processedRecords = records.filter(rec => {
    const matchesSearch = 
      (rec.tenant && `${rec.tenant.firstName} ${rec.tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.lease && rec.lease.leaseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rec.month.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'ALL' || rec.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading rent ledger...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Premium Header */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-indigo-400" />
              Rent Ledger
            </h1>
            <p className="text-slate-400 text-sm mt-1">Audit monthly billing cycles, process rent collections, and trigger outstanding overdue checks.</p>
          </div>
          {user && user.role !== 'TENANT' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={triggerOverdueCheck}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs font-bold rounded-lg transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Run Overdue Check
              </button>
              <button
                onClick={() => setShowGenerateForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Generate Rent
              </button>
            </div>
          )}
        </section>

        {/* Premium Command Filters bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledgers by billing month, lease reference, or tenant name..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Payment States</option>
              <option value="PAID">Realized Paid</option>
              <option value="PARTIAL">Partially Settled</option>
              <option value="PENDING">Awaiting Collections</option>
              <option value="OVERDUE">Outstanding Overdue</option>
            </select>
          </div>
        </section>

        {/* Stripe-like Tabular Ledger */}
        <section className="border border-slate-800 bg-[#0c0e1e]/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c0e1e]/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-850">
                  <th className="p-4 pl-6">Billing Month</th>
                  <th className="p-4">Tenant Coordinates</th>
                  <th className="p-4">Lease / Space</th>
                  <th className="p-4">Billing Due Date</th>
                  <th className="p-4">Balance Matrix</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {processedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 font-mono text-xs">
                      Zero matching rent invoices mapped in ledger logs.
                    </td>
                  </tr>
                ) : (
                  processedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-900/10 transition-colors group">
                      <td className="p-4 pl-6 font-mono font-bold text-indigo-400">
                        {rec.month}
                      </td>
                      <td className="p-4">
                        {rec.tenant ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{rec.tenant.firstName} {rec.tenant.lastName}</p>
                            <p className="text-[11px] text-slate-500">{rec.tenant.email}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                            Vacant Space
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {rec.lease ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200">Unit {rec.lease.unit?.unitNumber}</p>
                            <p className="text-[10px] text-slate-500 truncate">Lease: {rec.lease.leaseNumber}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Unbound</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300 font-mono">
                        {new Date(rec.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono text-xs space-y-0.5">
                        <p className="text-slate-300">Expected: ${Number(rec.amountDue)}</p>
                        <p className="text-emerald-400">Collected: ${Number(rec.amountPaid)}</p>
                        {Number(rec.lateFee) > 0 && (
                          <p className="text-red-400">Late Fee: +${Number(rec.lateFee)}</p>
                        )}
                        <p className="text-indigo-300 font-bold border-t border-slate-800/80 mt-1 pt-0.5">
                          Outstanding: ${Number(rec.balance)}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                          rec.paymentStatus === 'PAID' 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                            : rec.paymentStatus === 'PARTIAL'
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20'
                            : 'bg-red-950/60 text-red-400 border-red-500/20 animate-pulse'
                        }`}>
                          {rec.paymentStatus.toLowerCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {user && user.role !== 'TENANT' ? (
                          rec.paymentStatus !== 'PAID' ? (
                            <button
                              onClick={() => handleOpenPay(rec)}
                              className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center gap-1 ml-auto"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Record Collection
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Invoice closed</span>
                          )
                        ) : rec.paymentStatus === 'PAID' ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Paid & Cleared
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 justify-end animate-pulse">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            Awaiting Settle
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Premium Generate Rent Drawer Overlay */}
        {showGenerateForm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                    Generate Monthly Rent Invoices
                  </h3>
                  <p className="text-xs text-slate-400">Automates statement batching for all active leases.</p>
                </div>
                <button
                  onClick={() => setShowGenerateForm(false)}
                  className="p-1 border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleGenerateLedger} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Billing Month (YYYY-MM) *</label>
                  <input
                    type="text"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    placeholder="e.g. 2026-07"
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowGenerateForm(false)}
                    className="px-5 py-2.5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                  >
                    {submitting ? 'Generating...' : 'Confirm Generation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Premium Record Payment Drawer Overlay */}
        {showPayForm && selectedRecord && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
              
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Record Renter Payment
                  </h3>
                  <p className="text-xs text-slate-400">Statement: {selectedRecord.tenant.firstName} {selectedRecord.tenant.lastName} ({selectedRecord.month})</p>
                </div>
                <button
                  onClick={() => {
                    setShowPayForm(false);
                    setSelectedRecord(null);
                  }}
                  className="p-1 border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Amount Paid (₹) *</label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Late Fee (₹)</label>
                    <input
                      type="number"
                      value={lateFee}
                      onChange={(e) => setLateFee(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Transaction Reference *</label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Bank Transfer ID / Cheque #"
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Receipt upload URL</label>
                  <input
                    type="text"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="e.g. Cloudinary transaction receipt PDF/image"
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPayForm(false);
                      setSelectedRecord(null);
                    }}
                    className="px-5 py-2.5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                  >
                    {submitting ? 'Recording...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading payments ledgers...</div>
        </div>
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
