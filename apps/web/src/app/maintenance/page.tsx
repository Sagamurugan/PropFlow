'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  Wrench, 
  Search, 
  Plus, 
  Clock, 
  X, 
  CheckCircle, 
  AlertCircle,
  SlidersHorizontal,
  User,
  ShieldAlert,
  Calendar,
  Layers,
  Home,
  Briefcase,
  Activity,
  UserPlus
} from 'lucide-react';

function MaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get('unitId');
  const tenantIdParam = searchParams.get('tenantId');
  const propertyIdParam = searchParams.get('propertyId');

  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tenant role states
  const [user, setUser] = useState<any | null>(null);
  const [tenantUnit, setTenantUnit] = useState<any | null>(null);
  const [tenantProperty, setTenantProperty] = useState<any | null>(null);
  const [tenantRecord, setTenantRecord] = useState<any | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Ticket creation state
  const [ticketNumber, setTicketNumber] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyIdParam || '');
  const [selectedUnitId, setSelectedUnitId] = useState(unitIdParam || '');
  const [selectedTenantId, setSelectedTenantId] = useState(tenantIdParam || '');
  const [targetResolutionDate, setTargetResolutionDate] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Assignment / Resolution state
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, propertyIdParam, unitIdParam, tenantIdParam]);

  const fetchData = async () => {
    try {
      const session = getUserSession();
      if (!session) return;
      setUser(session);

      if (session.role === 'TENANT') {
        const [ticketsData, paymentsData] = await Promise.all([
          apiRequest('maintenance'),
          apiRequest('payments'),
        ]);
        setTickets(ticketsData || []);

        const primaryRecord = paymentsData[0] || null;
        const activeLease = primaryRecord?.lease || null;
        const activeUnit = activeLease?.unit || null;
        const activeProperty = activeUnit?.property || null;
        const activeTenant = primaryRecord?.tenant || null;

        if (activeUnit) setTenantUnit(activeUnit);
        if (activeProperty) setTenantProperty(activeProperty);
        if (activeTenant) setTenantRecord(activeTenant);
      } else {
        const [ticketsData, techsData, tenantsData, propsData, unitsData] = await Promise.all([
          apiRequest('maintenance'),
          apiRequest('maintenance/technicians'),
          apiRequest('tenants'),
          apiRequest('properties'),
          apiRequest('units'),
        ]);

        setTickets(ticketsData);
        setTechnicians(techsData);
        setTenants(tenantsData.filter((t: any) => t.status === 'ACTIVE'));
        setProperties(propsData);
        setUnits(unitsData);

        if (propsData.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(propsData[0].id);
        }
        if (unitsData.length > 0 && !selectedUnitId) {
          setSelectedUnitId(unitsData[0].id);
        }
        if (tenantsData.length > 0 && !selectedTenantId) {
          setSelectedTenantId(tenantsData[0].id);
        }
        if (techsData.length > 0) {
          setSelectedTechnicianId(techsData[0].id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAddForm) {
      setTicketNumber(`TKT-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [showAddForm]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const imageUrls = imgUrl ? [imgUrl] : [];

    const payload = {
      ticketNumber,
      category,
      priority,
      description,
      imageUrls,
      targetResolutionDate: targetResolutionDate ? new Date(targetResolutionDate).toISOString() : undefined,
      tenantId: user?.role === 'TENANT' ? tenantRecord?.id : selectedTenantId,
      unitId: user?.role === 'TENANT' ? tenantUnit?.id : selectedUnitId,
      propertyId: user?.role === 'TENANT' ? tenantProperty?.id : selectedPropertyId,
    };

    try {
      await apiRequest('maintenance', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Dispatched Repair Ticket: ${ticketNumber}`,
            entityType: 'MAINTENANCE',
            entityId: ticketNumber,
            performedBy: user?.role === 'TENANT' ? `${user.firstName} ${user.lastName}` : 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently
      }

      setTicketNumber('');
      setDescription('');
      setImgUrl('');
      setTargetResolutionDate('');
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit service dispatch ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssign = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowAssignForm(true);
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`maintenance/${selectedTicket.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: selectedTechnicianId }),
      });

      setShowAssignForm(false);
      setSelectedTicket(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResolve = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowResolveForm(true);
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`maintenance/${selectedTicket.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Resolved Repair Ticket: ${selectedTicket.ticketNumber}`,
            entityType: 'MAINTENANCE',
            entityId: selectedTicket.ticketNumber,
            performedBy: 'Assigned Tech',
          })
        });
      } catch {
        // Fallback silently
      }

      setShowResolveForm(false);
      setSelectedTicket(null);
      setResolutionNotes('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Resolution notes update failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Client side filtering (SaaS high-speed responsive experience)
  const processedTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.unit && t.unit.unitNumber.includes(searchQuery));
    
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading maintenance log...</div>
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
              <Wrench className="w-8 h-8 text-indigo-400" />
              Maintenance Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-1">Audit, schedule dispatches, assign trade specialists, and log resolution SLAs.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            File Repair Ticket
          </button>
        </section>

        {/* Premium Filters bar */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dispatches by ticket reference or unit number..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low priority</option>
              <option value="MEDIUM">Medium priority</option>
              <option value="HIGH">High priority</option>
              <option value="CRITICAL">Critical flags</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Operations Status</option>
              <option value="OPEN">Open tickets</option>
              <option value="ASSIGNED">Assigned dispatches</option>
              <option value="IN_PROGRESS">Active dispatches</option>
              <option value="RESOLVED">Resolved repairs</option>
            </select>
          </div>
        </section>

        {/* Premium Grid layout of repair tickets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {processedTickets.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0c0e1e]/20 flex flex-col items-center justify-center p-6 space-y-3">
              <Wrench className="w-12 h-12 text-slate-600 animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-400">Zero active service dispatches logged</p>
                <p className="text-xs text-slate-500">All property structures are operating optimally.</p>
              </div>
            </div>
          ) : (
            processedTickets.map((t) => (
              <div 
                key={t.id} 
                className="group border border-slate-800 bg-[#0c0e1e]/40 rounded-2xl p-6 shadow-xl hover:border-indigo-500/30 hover:bg-[#0f1228]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[320px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {t.category.toLowerCase()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      t.priority === 'CRITICAL' 
                        ? 'bg-red-950/60 text-red-400 border-red-500/20 animate-pulse' 
                        : t.priority === 'HIGH' 
                        ? 'bg-amber-950/60 text-amber-400 border-amber-500/20' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {t.priority.toLowerCase()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors font-mono">{t.ticketNumber}</h3>
                    <p className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5 pt-0.5">
                      <Home className="w-3.5 h-3.5" />
                      <span>{t.property?.name} • Unit {t.unit?.unitNumber}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3 bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                    {t.description}
                  </p>

                  {t.targetResolutionDate && (
                    <p className="text-[10px] text-red-400/80 font-bold flex items-center gap-1 font-mono pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      SLA DEADLINE: {new Date(t.targetResolutionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-850 text-xs space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Operation Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      t.status === 'RESOLVED' 
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                        : t.status === 'OPEN' 
                        ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20' 
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/20'
                    }`}>
                      {t.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Assigned Tech</span>
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      {t.technician?.name || 'Awaiting Specialist'}
                    </span>
                  </div>
                  
                  {t.resolutionNotes && (
                    <div className="bg-[#090b16] p-3 rounded-xl border border-slate-800 mt-2 space-y-1 shadow-inner">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Completion Summary</p>
                      <p className="text-xs text-slate-300 italic">"{t.resolutionNotes}"</p>
                    </div>
                  )}
                </div>

                {user && user.role !== 'TENANT' && (
                  <div className="flex justify-between gap-3 pt-4 border-t border-slate-850 mt-4">
                    {t.status === 'OPEN' && (
                      <button
                        onClick={() => handleOpenAssign(t)}
                        className="flex-1 py-2 bg-[#0e1124] hover:bg-slate-800 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign trade
                      </button>
                    )}
                    {(t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleOpenResolve(t)}
                        className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Log Completion
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Premium File Ticket Drawer Overlay */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-400" />
                    Raise Maintenance Dispatch Ticket
                  </h3>
                  <p className="text-xs text-slate-400">Log repair requests with SLA priority classifications.</p>
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

                <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {user?.role === 'TENANT' && (
                    <div className="md:col-span-2 p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5" />
                        Filing Request For My Unit
                      </p>
                      <p className="text-sm font-semibold text-slate-200">
                        Unit {tenantUnit?.unitNumber || 'Loading...'} in {tenantProperty?.name || 'Loading...'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        All repair ticket metrics, dispatches, and SLA progress are auto-synced to your landlord dashboard.
                      </p>
                    </div>
                  )}

                  {user?.role !== 'TENANT' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Ticket Code *</label>
                      <input
                        type="text"
                        required
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                        placeholder="e.g. TICKET-1092"
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Issue Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                    >
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="CLEANING">Cleaning</option>
                      <option value="SECURITY">Security</option>
                      <option value="INTERNET">Internet</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Urgency Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-sans"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Target SLA Resolution Date</label>
                    <input
                      type="date"
                      value={targetResolutionDate}
                      onChange={(e) => setTargetResolutionDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  {user?.role !== 'TENANT' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Property Complex *</label>
                        <select
                          value={selectedPropertyId}
                          onChange={(e) => setSelectedPropertyId(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-sans"
                        >
                          {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Unit *</label>
                        <select
                          value={selectedUnitId}
                          onChange={(e) => setSelectedUnitId(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>Unit {u.unitNumber} in {u.property?.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Reported By Tenant *</label>
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
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Issue Photo link (Cloudinary)</label>
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="e.g. https://res.cloudinary.com/..."
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Describe the Incident *</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Water leaking slowly from underneath the master bathroom sink..."
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
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
                      {submitting ? 'Registering...' : 'Dispatch Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Premium Assign Technician modal */}
        {showAssignForm && selectedTicket && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-400" />
                    Assign Dispatch Technician
                  </h3>
                  <p className="text-xs text-slate-400">Select specialist for Ticket: {selectedTicket.ticketNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignForm(false);
                    setSelectedTicket(null);
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

              <form onSubmit={handleAssignTechnician} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Specialist</label>
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                  >
                    {technicians.length === 0 ? (
                      <option value="">No Active Technicians Saved</option>
                    ) : (
                      technicians.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false);
                      setSelectedTicket(null);
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
                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Premium Log Resolution modal */}
        {showResolveForm && selectedTicket && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Log Ticket Resolution Summary
                  </h3>
                  <p className="text-xs text-slate-400">Record completion parameters for Ticket: {selectedTicket.ticketNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setShowResolveForm(false);
                    setSelectedTicket(null);
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

              <form onSubmit={handleResolveTicket} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Work Completion Summary *</label>
                  <textarea
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Replaced damaged washers in pipeline. Flow checked. Resolved leaks."
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResolveForm(false);
                      setSelectedTicket(null);
                      setResolutionNotes('');
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
                    {submitting ? 'Completing...' : 'Confirm Resolution'}
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

export default function MaintenancePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading maintenance workspace...</div>
        </div>
      </div>
    }>
      <MaintenanceContent />
    </Suspense>
  );
}
