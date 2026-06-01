'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  Building, 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Activity,
  Calendar,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  ClipboardList,
  Wallet,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Owner/Manager Portfolio Metrics
  const [kpis, setKpis] = useState<any>({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0,
    activeLeases: 0,
    monthlyRevenue: 0,
    overdueRent: 0,
    openTickets: 0,
  });

  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [maintenanceBreakdown, setMaintenanceBreakdown] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingLeases, setUpcomingLeases] = useState<any[]>([]);
  const [overduePayments, setOverduePayments] = useState<any[]>([]);

  // Tenant Portal Specific States
  const [tenantPayments, setTenantPayments] = useState<any[]>([]);
  const [tenantTickets, setTenantTickets] = useState<any[]>([]);

  // AI Property Health Score States
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData] = useState<any | null>(null);

  const fetchPropertyHealth = async (propertyId: string) => {
    if (!propertyId) return;
    setHealthLoading(true);
    try {
      const data = await apiRequest(`ai/properties/${propertyId}/health`);
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch property health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPropertyId(id);
    fetchPropertyHealth(id);
  };

  useEffect(() => {
    setMounted(true);
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session);
    fetchDashboardData(session);
  }, [router]);

  const fetchDashboardData = async (session: any) => {
    try {
      if (session.role === 'TENANT') {
        // Fetch only Tenant specific datasets
        const [payments, tickets] = await Promise.all([
          apiRequest('payments'),
          apiRequest('maintenance')
        ]);
        setTenantPayments(payments || []);
        setTenantTickets(tickets || []);
      } else {
        // Fetch full executive analytics for Landlords / Owners / Managers
        const [data, propsList] = await Promise.all([
          apiRequest('analytics/summary'),
          apiRequest('properties')
        ]);
        
        if (data) {
          setKpis(data.kpis || {});
          setRevenueTrend(data.charts?.revenueTrend || []);
          setMaintenanceBreakdown(data.charts?.maintenanceBreakdown || []);
          setRecentActivities(data.recentActivities || []);
          setUpcomingLeases(data.upcomingLeases || []);
          setOverduePayments(data.overduePayments || []);
        }

        setProperties(propsList || []);
        if (propsList && propsList.length > 0) {
          setSelectedPropertyId(propsList[0].id);
          fetchPropertyHealth(propsList[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Initializing PropFlow Workspace...</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER TENANT PORTAL DASHBOARD (SCOPED RBAC)
  // ==========================================
  if (user.role === 'TENANT') {
    // Computed states for the active Tenant lease context
    const primaryRecord = tenantPayments[0] || null;
    const activeLease = primaryRecord?.lease || null;
    const activeUnit = activeLease?.unit || null;
    const activeProperty = activeUnit?.property || null;

    // Total outstanding balance
    const totalOutstanding = tenantPayments.reduce((sum, item) => sum + Number(item.balance), 0);
    const activeTicketsCount = tenantTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

    // Days remaining on lease
    let daysRemaining = 0;
    if (activeLease?.endDate) {
      const diffTime = new Date(activeLease.endDate).getTime() - new Date().getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* Welcome Banner */}
          <section aria-labelledby="welcome-heading" className="relative group overflow-hidden border border-slate-800/80 bg-[#0c0e1e]/60 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] tracking-widest font-bold text-slate-400 uppercase font-mono">Tenant Portal Secure Boundary</span>
              </div>
              <h1 id="welcome-heading" className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-100">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold">{user.firstName}</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                PropFlow AI Tenant Space initialized. View outstanding rent statements, pay online, or request on-demand maintenance repairs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="border border-slate-800/80 bg-[#0e1124] rounded-xl px-5 py-4 flex flex-col gap-1 min-w-[200px] shadow-inner shadow-slate-950/40">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold font-mono">My Account Link</span>
                <span className="text-xs font-bold text-indigo-400 truncate font-mono">{user.email}</span>
              </div>
            </div>
          </section>

          {/* Tenant Scoped KPI Dashboard */}
          <section aria-label="Tenant Metrics Grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rented Space Card */}
            <div className="group border border-slate-800/80 bg-[#0c0e1e]/40 rounded-xl p-6 flex flex-col justify-between min-h-[140px] shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">My Rental Unit</span>
                <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-lg">
                  <Home className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {activeUnit ? `Unit ${activeUnit.unitNumber}` : 'Unassigned'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="truncate">{activeProperty ? activeProperty.name : 'No active complex linking'}</span>
                </div>
              </div>
            </div>

            {/* Monthly Rent */}
            <div className="group border border-slate-800/80 bg-[#0c0e1e]/40 rounded-xl p-6 flex flex-col justify-between min-h-[140px] shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Monthly Rent</span>
                <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-lg">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {activeLease ? `₹${Number(activeLease.monthlyRent).toLocaleString()}` : '₹0'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Due on 5th of each month</span>
                </div>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div 
              onClick={() => router.push('/payments')}
              className="group border border-slate-800/80 bg-[#0c0e1e]/40 rounded-xl p-6 flex flex-col justify-between min-h-[140px] shadow-lg hover:bg-[#0f1228]/60 hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-350 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Outstanding Balance</span>
                <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-lg">
                  <AlertTriangle className={`w-5 h-5 ${totalOutstanding > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <p className={`text-2xl font-extrabold ${totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'} tracking-tight`}>
                  ₹{totalOutstanding.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{totalOutstanding > 0 ? 'Pending payment collection' : 'Rent ledger fully cleared'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>

            {/* Lease Status */}
            <div className="group border border-slate-800/80 bg-[#0c0e1e]/40 rounded-xl p-6 flex flex-col justify-between min-h-[140px] shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Lease Status</span>
                <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-2xl font-extrabold text-slate-100 tracking-tight">
                  {activeLease ? `${daysRemaining} Days` : 'Inactive'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{activeLease ? `Expires: ${new Date(activeLease.endDate).toLocaleDateString()}` : 'No active contract binding'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Split Section: Rent Ledger & Tickets */}
          <section aria-label="Tenant Pipeline Grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rent Ledger Statement List */}
            <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    My Rent Statements & Receipts
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Scoping all billing cycles and payment statements.</p>
                </div>
                <button 
                  onClick={() => router.push('/payments')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                  Go to Rent Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-850">
                      <th className="pb-3">Month</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3">Amount Due</th>
                      <th className="pb-3">Balance</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                    {tenantPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                          No rent invoices registered to your account yet.
                        </td>
                      </tr>
                    ) : (
                      tenantPayments.slice(0, 5).map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-bold text-indigo-400 font-mono">{pay.month}</td>
                          <td className="py-3.5 font-mono">{new Date(pay.dueDate).toLocaleDateString()}</td>
                          <td className="py-3.5 font-mono">₹{Number(pay.amountDue).toLocaleString()}</td>
                          <td className="py-3.5 font-mono text-indigo-300 font-bold">₹{Number(pay.balance).toLocaleString()}</td>
                          <td className="py-3.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              pay.paymentStatus === 'PAID' 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                                : pay.paymentStatus === 'PARTIAL'
                                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20'
                                : 'bg-red-950/60 text-red-400 border-red-500/20 animate-pulse'
                            }`}>
                              {pay.paymentStatus.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tenant Active Maintenance Tickets */}
            <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-400" />
                    My Repair Tickets
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tickets active: {activeTicketsCount}</p>
                </div>
                <button
                  onClick={() => router.push('/maintenance')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                  Raise Ticket
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {tenantTickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20 gap-1 p-4">
                    <span>No repair tickets raised yet.</span>
                    <span className="text-[10px] text-slate-600">Got an issue? Request landlord assistance.</span>
                  </div>
                ) : (
                  tenantTickets.slice(0, 4).map((ticket) => (
                    <div key={ticket.id} className="group p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-indigo-500/20 transition-all cursor-pointer" onClick={() => router.push('/maintenance')}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors truncate max-w-[150px]">
                            {ticket.category} Ticket
                          </p>
                          <p className="text-[10px] text-slate-500">Log: {new Date(ticket.createdAt).toLocaleDateString()} | #{ticket.ticketNumber}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-950/60 text-amber-400 border-amber-500/20'
                        }`}>
                          {ticket.status.toLowerCase()}
                        </span>
                      </div>
                      {ticket.technician && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-900/60 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span>Dispatch: {ticket.technician.name} ({ticket.technician.specialization})</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER OWNER/MANAGER EXECUTIVE DASHBOARD
  // ==========================================
  const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const filteredActivities = recentActivities.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Accessibility Skip to Main Content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50 text-sm font-medium">
        Skip to main content
      </a>

      <Navbar />

      {/* Main Content Workspace */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Welcome Banner */}
        <section aria-labelledby="welcome-heading" className="relative group overflow-hidden border border-slate-800/80 bg-[#0c0e1e]/60 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/15 transition-all duration-750" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-widest font-bold text-slate-400 uppercase font-mono">Executive Space Active</span>
            </div>
            <h1 id="welcome-heading" className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-100">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold">{user.firstName}</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              PropFlow AI environment initialized. Real-time assets metrics successfully fetched from cloud database context.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="border border-slate-800/80 bg-[#0e1124] rounded-xl px-5 py-4 flex flex-col gap-1 min-w-[200px] shadow-inner shadow-slate-950/40">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold font-mono">Tenant ID Boundary</span>
              <span className="text-xs font-bold text-indigo-400 truncate font-mono">{user.organizationId}</span>
            </div>
          </div>
        </section>

        {/* AI Property Health Score Section */}
        {properties.length > 0 && (
          <section className="bg-gradient-to-br from-[#0b0e22] via-[#090b16] to-[#0d0f28] border border-indigo-500/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  AI Property Health Monitor
                </h2>
                <p className="text-xs text-slate-400">Select any asset to compute its dynamic health index and load operations briefings.</p>
              </div>

              <div>
                <select
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                  className="px-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/40 transition-all font-semibold font-sans cursor-pointer"
                >
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {healthLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-400 font-mono">Running portfolio diagnostics & querying Gemini asset models...</p>
              </div>
            ) : healthData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Score Circular Gauge & Subscales */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-6 flex flex-col items-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* SVG Radial Progress */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#1e293b"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={healthData.score > 80 ? '#10b981' : healthData.score > 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - healthData.score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
                      <span className="text-3xl font-black text-slate-100 tracking-tighter">{healthData.score}%</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Health Index</span>
                    </div>
                  </div>

                  <div className="w-full space-y-3.5">
                    {[
                      { label: 'Occupancy Rate', val: healthData.breakdown.occupancy, color: 'bg-emerald-500' },
                      { label: 'Financial Rent Stream', val: healthData.breakdown.financial, color: 'bg-indigo-500' },
                      { label: 'Maintenance SLA', val: healthData.breakdown.maintenance, color: 'bg-amber-500' },
                      { label: 'Lease Stability', val: healthData.breakdown.lease, color: 'bg-purple-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-200 font-mono">{item.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${item.val}%` }}
                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Executive Intelligence briefing */}
                <div className="lg:col-span-2 space-y-5">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    AI Asset Strategist Briefing
                  </h3>

                  <div className="space-y-4">
                    {/* Render split briefings formatted nicely */}
                    {(() => {
                      const text = healthData.interpretation || '';
                      // Split text by lines and parse headings
                      const lines = text.split('\n');
                      const sections: { title: string; bullets: string[]; type: string }[] = [];
                      let currentSection: { title: string; bullets: string[]; type: string } | null = null;

                      for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        if (
                          trimmed.toUpperCase().includes('SUMMARY') || 
                          trimmed.toUpperCase().includes('RISK') || 
                          trimmed.toUpperCase().includes('STEP') ||
                          trimmed.startsWith('- EXECUTIVE') ||
                          trimmed.startsWith('- CRITICAL') ||
                          trimmed.startsWith('- ACTIONABLE')
                        ) {
                          if (currentSection) {
                            sections.push(currentSection);
                          }
                          const title = trimmed.replace(/^-\s*/, '').replace(/:\s*$/, '');
                          let type = 'summary';
                          if (title.toUpperCase().includes('RISK')) type = 'risk';
                          if (title.toUpperCase().includes('STEP') || title.toUpperCase().includes('ACTION')) type = 'action';
                          
                          currentSection = { title, bullets: [], type };
                        } else if (currentSection) {
                          currentSection.bullets.push(trimmed.replace(/^[-*•]\s*/, ''));
                        }
                      }
                      if (currentSection) {
                        sections.push(currentSection);
                      }

                      if (sections.length === 0) {
                        // Fallback simple view
                        return (
                          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs whitespace-pre-line leading-relaxed font-sans">
                            {text}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 gap-4 font-sans">
                          {sections.map((sec, sidx) => (
                            <div
                              key={sidx}
                              className={`p-4 rounded-xl border ${
                                sec.type === 'risk'
                                  ? 'bg-red-950/20 border-red-500/20'
                                  : sec.type === 'action'
                                  ? 'bg-emerald-950/20 border-emerald-500/20'
                                  : 'bg-slate-900/40 border-slate-850'
                              }`}
                            >
                              <h4
                                className={`text-xs font-bold uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5 ${
                                  sec.type === 'risk'
                                    ? 'text-red-400'
                                    : sec.type === 'action'
                                    ? 'text-emerald-400'
                                    : 'text-indigo-400'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  sec.type === 'risk' ? 'bg-red-400' : sec.type === 'action' ? 'bg-emerald-400' : 'bg-indigo-400'
                                }`} />
                                {sec.title}
                              </h4>
                              {sec.bullets.length > 0 ? (
                                <ul className="space-y-1.5">
                                  {sec.bullets.map((b, bidx) => (
                                    <li key={bidx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                                      <span className="text-slate-500 mt-1 select-none font-bold">•</span>
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Analyzing details...</p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 bg-slate-950/20 rounded-xl">
                Select a property above to retrieve AI operational analytics.
              </div>
            )}
          </section>
        )}

        {/* Dynamic Computed KPI Panel */}
        <section aria-label="Portfolio Metrics Grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Properties Portfolio', val: kpis.totalProperties, desc: 'Registered property complexes', icon: <Building className="w-5 h-5 text-indigo-400" />, path: '/properties' },
            { label: 'Total Rental Units', val: kpis.totalUnits, desc: 'Apartment units registered', icon: <Home className="w-5 h-5 text-indigo-400" />, path: '/units' },
            { label: 'Portfolio Occupancy', val: `${kpis.occupancyRate}%`, desc: 'Occupied vs vacant units', icon: <Users className="w-5 h-5 text-emerald-400" />, path: '/analytics/occupancy', color: 'text-emerald-400' },
            { label: 'Active Leases', val: kpis.activeLeases, desc: 'Contracts currently active', icon: <FileText className="w-5 h-5 text-indigo-400" />, path: '/leases' },
            { label: 'Monthly Revenue', val: `₹${Number(kpis.monthlyRevenue).toLocaleString()}`, desc: 'Rent collections this month', icon: <DollarSign className="w-5 h-5 text-emerald-400" />, path: '/analytics/revenue', color: 'text-emerald-400' },
            { label: 'Overdue Balances', val: `₹${Number(kpis.overdueRent).toLocaleString()}`, desc: 'Outstanding balances flagged', icon: <AlertTriangle className="w-5 h-5 text-red-400" />, path: '/payments', color: 'text-red-400' },
            { label: 'Pending Repairs', val: kpis.openTickets, desc: 'Active tickets awaiting dispatches', icon: <Wrench className="w-5 h-5 text-amber-400" />, path: '/maintenance', color: 'text-amber-400' },
            { label: 'Space Scaffolding', val: `${kpis.occupiedUnits} / ${kpis.totalUnits}`, desc: `${kpis.vacantUnits} vacant spaces available`, icon: <Clock className="w-5 h-5 text-indigo-400" />, path: '/analytics/occupancy' },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => card.path && router.push(card.path)}
              className="group border border-slate-800/80 bg-[#0c0e1e]/40 rounded-xl p-6 flex flex-col justify-between min-h-[140px] shadow-lg hover:bg-[#0f1228]/60 hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-350 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">{card.label}</span>
                <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-lg group-hover:border-indigo-500/20 transition-colors">
                  {card.icon}
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <p className={`text-3xl font-extrabold ${card.color || 'text-slate-100'} tracking-tight`}>{card.val}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{card.desc}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Dynamic Command & Search Panel */}
        <section aria-label="Quick Search" className="flex flex-col sm:flex-row items-center gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, performers, properties, or dates in timeline..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800/50 hover:text-white rounded-lg text-xs font-semibold text-slate-400 transition-all w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter Board
            </button>
            <button
              onClick={() => router.push('/properties')}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all w-full sm:w-auto shadow-lg shadow-indigo-600/10"
            >
              <Plus className="w-3.5 h-3.5" />
              New Asset
            </button>
          </div>
        </section>

        {/* Executive Recharts Section */}
        <section aria-label="Visual Analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Historical Line Chart */}
          <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Financial Revenue Streams
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Historical rental collections vs expected invoices.</p>
              </div>
              <button 
                onClick={() => router.push('/analytics/revenue')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
              >
                Detailed Revenue Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 w-full h-64 min-h-[250px]">
              {mounted && revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#14192d" />
                    <XAxis dataKey="label" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090b16', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                      labelClassName="font-mono text-xs text-slate-500 font-bold"
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="expected" name="Expected Billing" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="collected" name="Realized Collections" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 font-mono text-xs">
                  {mounted ? 'No historical ledger entries to display.' : 'Initializing graph context...'}
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Repair Breakdown Pie Chart */}
          <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Repairs Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Dispatches divided by trade category.</p>
              </div>
              <button 
                onClick={() => router.push('/analytics/maintenance')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
              >
                Audit SLA
              </button>
            </div>

            <div className="flex-1 w-full h-64 min-h-[250px] flex items-center justify-center relative">
              {mounted && maintenanceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceBreakdown}
                      cx="50%"
                      cy="40%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {maintenanceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090b16', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }} />
                    <Legend verticalAlign="bottom" height={50} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 font-mono text-xs">
                  {mounted ? 'No maintenance tickets compiled.' : 'Initializing graph context...'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Lists Section */}
        <section aria-label="Portfolios Details Pipeline" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Security Audited Activity Logs Timeline */}
          <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
            <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
              <span>Relational Activity Audit</span>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-sans">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((log) => (
                  <div key={log.id} className="group flex items-start gap-3 text-sm hover:bg-slate-900/10 p-1 rounded-lg transition-colors">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{log.action}</p>
                      <p className="text-[11px] text-slate-500">
                        {log.performedBy} | {log.entityType} ({new Date(log.createdAt).toLocaleDateString()})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20 gap-1 p-4">
                  <span>No security log activities written.</span>
                  <span className="text-[10px] text-slate-600">Dynamic transactions trigger auto-logs.</span>
                </div>
              )}
            </div>
          </div>

          {/* Lease Expiration Pipeline Table */}
          <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-100">Lease Expiry Pipeline</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/20 font-mono">30 Days Scope</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {upcomingLeases.length > 0 ? (
                upcomingLeases.map((lease) => (
                  <div key={lease.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-indigo-500/20 transition-all cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">{lease.tenantName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>Unit {lease.unitNumber}</span>
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                        <span>Ends: {new Date(lease.endDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-900/20 border border-indigo-500/10 text-indigo-300 font-bold text-[10px] font-mono">
                      {lease.daysRemaining}d left
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20 font-mono">
                  All active lease contracts are secure.
                </div>
              )}
            </div>
          </div>

          {/* Overdue Payment Default Alerts */}
          <div className="border border-slate-800/80 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold tracking-tight text-slate-100">Overdue Default Flags</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-500/20 font-mono font-bold">Ledger Alert</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {overduePayments.length > 0 ? (
                overduePayments.map((pay) => (
                  <div key={pay.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-red-500/20 transition-all cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">{pay.tenantName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>Statement: {pay.month}</span>
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                        <span>Due: {new Date(pay.dueDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-900/20 border border-red-500/10 text-red-400 font-extrabold text-[10px] font-mono"> ₹{pay.balance}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20 font-mono">
                  Zero overdue billing records flagged.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
