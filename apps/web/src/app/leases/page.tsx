'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, getUserSession, getAccessToken } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  X, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  User,
  Home,
  RefreshCw,
  FileSignature,
  Sparkles,
  UploadCloud
} from 'lucide-react';

function LeasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get('unitId');
  const tenantIdParam = searchParams.get('tenantId');

  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Lease Intelligence States
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParsedData, setAiParsedData] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiParsing(true);
    setAiError(null);
    setAiParsedData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAccessToken();
      const headers = new Headers();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const userApiKey = localStorage.getItem('pf_gemini_api_key');
      if (userApiKey) {
        headers.set('x-gemini-api-key', userApiKey);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/ai/leases/parse`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to parse lease PDF');
      }

      const parsed = await res.json();
      setAiParsedData(parsed);
    } catch (err: any) {
      setAiError(err.message || 'Error occurred while processing lease PDF.');
    } finally {
      setAiParsing(false);
    }
  };

  const handleAutofillDraft = () => {
    if (!aiParsedData) return;
    setLeaseNumber(aiParsedData.leaseNumber || `L-AI-${Math.floor(1000 + Math.random() * 9000)}`);
    setMonthlyRent(aiParsedData.rentAmount || 1500);
    setSecurityDeposit(aiParsedData.securityDeposit || 1500);
    setStartDate(aiParsedData.startDate || '');
    setEndDate(aiParsedData.endDate || '');
    setNoticePeriodDays(aiParsedData.noticePeriodDays || 30);
    setSignedDocumentUrl('https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg');
    setShowAddForm(true);
  };
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [selectedLeaseForRenewal, setSelectedLeaseForRenewal] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Create Lease Form State
  const [leaseNumber, setLeaseNumber] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(tenantIdParam || '');
  const [selectedUnitId, setSelectedUnitId] = useState(unitIdParam || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(1500);
  const [securityDeposit, setSecurityDeposit] = useState(1550);
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Renewal Form State
  const [newLeaseNumber, setNewLeaseNumber] = useState('');
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRent, setRenewRent] = useState(1500);
  const [renewDeposit, setRenewDeposit] = useState(1500);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, unitIdParam, tenantIdParam]);

  const fetchData = async () => {
    try {
      const [leasesData, tenantsData, unitsData] = await Promise.all([
        apiRequest('leases'),
        apiRequest('tenants'),
        apiRequest('units'),
      ]);
      setLeases(leasesData);
      setTenants(tenantsData.filter((t: any) => t.status === 'ACTIVE'));
      
      const vacantList = unitsData.filter((u: any) => u.status === 'VACANT' || u.id === unitIdParam);
      setUnits(vacantList);

      if (tenantsData.length > 0 && !selectedTenantId) {
        setSelectedTenantId(tenantsData[0].id);
      }
      if (vacantList.length > 0 && !selectedUnitId) {
        setSelectedUnitId(vacantList[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('leases', {
        method: 'POST',
        body: JSON.stringify({
          leaseNumber,
          tenantId: selectedTenantId,
          unitId: selectedUnitId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          noticePeriodDays: Number(noticePeriodDays),
          signedDocumentUrl: signedDocumentUrl || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Created Lease Agreement: ${leaseNumber}`,
            entityType: 'LEASE',
            entityId: leaseNumber,
            performedBy: 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently
      }

      setLeaseNumber('');
      setSignedDocumentUrl('');
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create lease contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRenew = (lease: any) => {
    setSelectedLeaseForRenewal(lease);
    setNewLeaseNumber(`${lease.leaseNumber}-R1`);
    setRenewRent(Number(lease.monthlyRent));
    setRenewDeposit(Number(lease.securityDeposit));
    setShowRenewForm(true);
  };

  const handleRenewLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseForRenewal) return;
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`leases/${selectedLeaseForRenewal.id}/renew`, {
        method: 'POST',
        body: JSON.stringify({
          newLeaseNumber,
          startDate: new Date(renewStartDate).toISOString(),
          endDate: new Date(renewEndDate).toISOString(),
          monthlyRent: Number(renewRent),
          securityDeposit: Number(renewDeposit),
        }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Renewed Lease Agreement: ${selectedLeaseForRenewal.leaseNumber} -> ₹${newLeaseNumber}`,
            entityType: 'LEASE',
            entityId: newLeaseNumber,
            performedBy: 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently
      }

      setShowRenewForm(false);
      setSelectedLeaseForRenewal(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Lease renewal execution failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Client side sorting and searching (Optimistic SaaS responsiveness)
  const processedLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.leaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lease.tenant && `${lease.tenant.firstName} ${lease.tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lease.unit && lease.unit.unitNumber.includes(searchQuery));
    
    const matchesStatus = filterStatus === 'ALL' || lease.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading lease agreements...</div>
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
              <FileSignature className="w-8 h-8 text-indigo-400" />
              Lease Agreements
            </h1>
            <p className="text-slate-400 text-sm mt-1">Audit, configure version control histories, and renew legal property leases dynamically.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Draft Lease Contract
          </button>
        </section>

        {/* AI Lease Intelligence Panel */}
        <section className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-6 space-y-6 shadow-2xl shadow-indigo-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                AI Lease Intelligence
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Upload a residential tenancy lease PDF. Our AI parses financial agreements, notice periods, terms, and flags risk clauses in real time.
              </p>
            </div>
            <div className="relative">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-lg shadow-indigo-600/10 transition-all">
                <UploadCloud className="w-4 h-4" />
                {aiParsing ? 'AI Parsing Agreement...' : 'Upload Lease Agreement'}
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={aiParsing}
                  onChange={handleAiUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {aiParsing && (
            <div className="p-8 bg-slate-950/50 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400 font-mono">Gemini 2.5 Pro is analyzing structural lease terms & risks...</p>
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{aiError}</span>
            </div>
          )}

          {aiParsedData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40 rounded-xl border border-slate-800 p-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="md:col-span-2 space-y-5">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Extracted Structured Key Terms
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lease Code</p>
                    <p className="text-sm font-bold text-slate-200 font-mono mt-1">{aiParsedData.leaseNumber}</p>
                  </div>
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rent / mo</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-1">₹{aiParsedData.rentAmount}</p>
                  </div>
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Deposit</p>
                    <p className="text-sm font-bold text-indigo-400 font-mono mt-1">₹{aiParsedData.securityDeposit}</p>
                  </div>
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Start Date</p>
                    <p className="text-sm font-bold text-slate-300 font-mono mt-1">{aiParsedData.startDate}</p>
                  </div>
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expiry Date</p>
                    <p className="text-sm font-bold text-slate-300 font-mono mt-1">{aiParsedData.endDate}</p>
                  </div>
                  <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Notice Period</p>
                    <p className="text-sm font-bold text-slate-300 font-mono mt-1">{aiParsedData.noticePeriodDays} days</p>
                  </div>
                </div>

                {aiParsedData.keyTerms && aiParsedData.keyTerms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Covenants & Rules</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                      {aiParsedData.keyTerms.map((term: string, idx: number) => (
                        <li key={idx}>{term}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-850 pt-5 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Security & Intelligence Review
                  </h3>
                  
                  {aiParsedData.riskFlags && aiParsedData.riskFlags.length > 0 ? (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg space-y-1.5">
                      <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Risk Alerts Flagged
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                        {aiParsedData.riskFlags.map((risk: string, idx: number) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        No High Risk Clauses Found
                      </p>
                    </div>
                  )}

                  {aiParsedData.renewalRecommendations && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Renewal Recommendation</p>
                      <p className="text-xs text-indigo-300 italic">"{aiParsedData.renewalRecommendations}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleAutofillDraft}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all animate-bounce"
                  >
                    <Plus className="w-4 h-4" />
                    Autofill Draft Form
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Premium Command Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agreements directory by lease code, tenant, or unit..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Lease States</option>
              <option value="ACTIVE">Active Agreements</option>
              <option value="DRAFT">Draft Mode</option>
              <option value="EXPIRED">Expired History</option>
              <option value="RENEWED">Renewed Chains</option>
            </select>
          </div>
        </section>

        {/* Stripe-like Tabular Ledger */}
        <section className="border border-slate-800 bg-[#0c0e1e]/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c0e1e]/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-850">
                  <th className="p-4 pl-6">Lease Reference</th>
                  <th className="p-4">Leaseholder</th>
                  <th className="p-4">Binds Unit</th>
                  <th className="p-4">Term Dates</th>
                  <th className="p-4">Rent / Deposit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {processedLeases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500 font-mono text-xs">
                      Zero matching lease agreements found in portfolio logs.
                    </td>
                  </tr>
                ) : (
                  processedLeases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-slate-900/10 transition-colors group">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{lease.leaseNumber}</p>
                        {lease.previousLease && (
                          <p className="text-[10px] text-indigo-400/80 font-semibold flex items-center gap-1 mt-0.5 font-mono">
                            <RefreshCw className="w-2.5 h-2.5" />
                            History: {lease.previousLease.leaseNumber}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {lease.tenant ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              {lease.tenant.firstName} {lease.tenant.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{lease.tenant.email}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                            Vacant Space
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {lease.unit ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-indigo-400" />
                              Unit {lease.unit.unitNumber}
                            </p>
                            <p className="text-[10px] text-indigo-300/80 truncate font-semibold">{lease.unit.property?.name}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Unbound</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(lease.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-slate-500 pl-5">to {new Date(lease.endDate).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4 font-mono">
                        <p className="font-bold text-slate-200 flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          {Number(lease.monthlyRent)}/mo
                        </p>
                        <p className="text-[10px] text-slate-500 pl-4">Deposit: ${Number(lease.securityDeposit)}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                          lease.status === 'ACTIVE' 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                            : lease.status === 'DRAFT'
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20'
                            : 'bg-red-950/60 text-red-400 border-red-500/20'
                        }`}>
                          {lease.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {lease.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleOpenRenew(lease)}
                            className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center gap-1 ml-auto"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Renew
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">History locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Premium Create Lease Drawer Panel */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-400" />
                    Draft Legal Lease Agreement
                  </h3>
                  <p className="text-xs text-slate-400">Bind tenants to vacant spaces with custom dynamic rent specification limits.</p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {error && (
                  <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleCreateLease} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Lease Code *</label>
                    <input
                      type="text"
                      required
                      value={leaseNumber}
                      onChange={(e) => setLeaseNumber(e.target.value)}
                      placeholder="e.g. L-501B-2026"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Active Tenant *</label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-sans"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Vacant Unit *</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>Unit {u.unitNumber} (${Number(u.rentAmount)}/mo) in {u.property?.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Rent Amount *</label>
                      <input
                        type="number"
                        required
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Security Deposit</label>
                      <input
                        type="number"
                        required
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Lease Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Lease End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Notice Period (Days)</label>
                    <input
                      type="number"
                      required
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Agreement Doc URL</label>
                    <input
                      type="text"
                      value={signedDocumentUrl}
                      onChange={(e) => setSignedDocumentUrl(e.target.value)}
                      placeholder="e.g. Cloudinary uploaded lease PDF"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-850 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all flex items-center gap-1.5"
                    >
                      {submitting ? 'Drafting...' : 'Save Lease Contract'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Premium Renew Lease Drawer Panel */}
        {showRenewForm && selectedLeaseForRenewal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-400" />
                    Renew Contract: {selectedLeaseForRenewal.leaseNumber}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Chain a new lease iteration atomically to the old active one.</p>
                </div>
                <button
                  onClick={() => {
                    setShowRenewForm(false);
                    setSelectedLeaseForRenewal(null);
                  }}
                  className="p-1.5 border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {error && (
                  <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRenewLease} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">New Lease Number *</label>
                    <input
                      type="text"
                      required
                      value={newLeaseNumber}
                      onChange={(e) => setNewLeaseNumber(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Monthly Rent Amount *</label>
                    <input
                      type="number"
                      required
                      value={renewRent}
                      onChange={(e) => setRenewRent(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Security Deposit (₹)</label>
                    <input
                      type="number"
                      required
                      value={renewDeposit}
                      onChange={(e) => setRenewDeposit(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Renewed Start Date *</label>
                    <input
                      type="date"
                      required
                      value={renewStartDate}
                      onChange={(e) => setRenewStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Renewed End Date *</label>
                    <input
                      type="date"
                      required
                      value={renewEndDate}
                      onChange={(e) => setRenewEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-850 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRenewForm(false);
                        setSelectedLeaseForRenewal(null);
                      }}
                      className="px-5 py-2.5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all flex items-center gap-1.5"
                    >
                      {submitting ? 'Executing...' : 'Execute Renewal Chain'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LeasesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading leases workspace...</div>
        </div>
      </div>
    }>
      <LeasesContent />
    </Suspense>
  );
}
