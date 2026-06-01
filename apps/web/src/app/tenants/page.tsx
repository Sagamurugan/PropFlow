'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Briefcase, 
  Mail, 
  Phone, 
  Home, 
  Calendar,
  X,
  FileText,
  AlertCircle,
  FileDown
} from 'lucide-react';

function TenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitIdParam = searchParams.get('unitId');

  const [tenants, setTenants] = useState<any[]>([]);
  const [vacantUnits, setVacantUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [occupation, setOccupation] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(unitIdParam || '');
  const [docType, setDocType] = useState('PASSPORT');
  const [docUrl, setDocUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, unitIdParam]);

  const fetchData = async () => {
    try {
      const [tenantsData, unitsData] = await Promise.all([
        apiRequest('tenants'),
        apiRequest('units'),
      ]);
      setTenants(tenantsData);
      
      const vacantList = unitsData.filter((u: any) => u.status === 'VACANT');
      setVacantUnits(vacantList);
      if (vacantList.length > 0 && !selectedUnitId) {
        setSelectedUnitId(vacantList[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const docPayload = docUrl ? [{ documentType: docType, documentUrl: docUrl }] : [];

    try {
      await apiRequest('tenants', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          emergencyContact,
          occupation,
          nationalId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          moveInDate: moveInDate ? new Date(moveInDate).toISOString() : new Date().toISOString(),
          avatarUrl: avatarUrl || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
          unitId: selectedUnitId || undefined,
          documents: docPayload,
        }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Logged Tenant Move-In: ${firstName} ${lastName}`,
            entityType: 'TENANT',
            entityId: email,
            performedBy: 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently if logger is decoupled
      }

      // Reset
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setEmergencyContact('');
      setOccupation('');
      setNationalId('');
      setDateOfBirth('');
      setMoveInDate('');
      setAvatarUrl('');
      setDocUrl('');
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete tenant Move-In process');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveOut = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to log move-out for tenant "${name}"? The leased space will revert to vacant.`)) return;
    try {
      await apiRequest(`tenants/${id}/move-out`, { method: 'POST' });
      fetchData();
    } catch {
      // Fallback
    }
  };

  // Dynamic search & filters (optimistic UI responsiveness)
  const processedTenants = tenants.filter(ten => {
    const matchesSearch = 
      `${ten.firstName} ${ten.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ten.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ten.unit?.unitNumber && ten.unit.unitNumber.includes(searchQuery));
    
    const matchesStatus = filterStatus === 'ALL' || ten.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading tenants directory...</div>
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
              <Users className="w-8 h-8 text-indigo-400" />
              Tenants Ledger
            </h1>
            <p className="text-slate-400 text-sm mt-1">Audit active profiles, occupational specifications, move-in logs, and lease alignments.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Move-In Tenant
          </button>
        </section>

        {/* Premium Command Filters bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenants directory by name, email, or unit..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Portfolio Tenants</option>
              <option value="ACTIVE">Active Leaseholders</option>
              <option value="INACTIVE">Inactive Profiles</option>
              <option value="MOVED_OUT">Moved Out tenants</option>
            </select>
          </div>
        </section>

        {/* Stripe-like Tabular Ledger Grid */}
        <section className="border border-slate-800 bg-[#0c0e1e]/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c0e1e]/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-850">
                  <th className="p-4 pl-6">Tenant Profile</th>
                  <th className="p-4">Contact Coordinates</th>
                  <th className="p-4">Assigned Space</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {processedTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 font-mono text-xs">
                      Zero matching records compiled in this portfolio scope.
                    </td>
                  </tr>
                ) : (
                  processedTenants.map((ten) => (
                    <tr key={ten.id} className="hover:bg-slate-900/10 transition-colors group">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-indigo-400 border border-slate-800/80 shadow-md">
                          {ten.firstName[0]}{ten.lastName[0]}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{ten.firstName} {ten.lastName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-slate-600" />
                            <span>{ten.occupation || 'Trade Unspecified'}</span>
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {ten.email}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {ten.phone}
                        </p>
                      </td>
                      <td className="p-4">
                        {ten.unit ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-indigo-400" />
                              Unit {ten.unit.unitNumber}
                            </p>
                            <p className="text-[10px] text-indigo-300/80 truncate font-semibold">{ten.unit.property?.name}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                            Unleased
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                          ten.status === 'ACTIVE' 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-950/60 text-red-400 border-red-500/20'
                        }`}>
                          {ten.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {ten.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleMoveOut(ten.id, `${ten.firstName} ${ten.lastName}`)}
                            className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-300 text-xs font-bold rounded-lg border border-red-500/20 hover:border-red-500/30 transition-all"
                          >
                            Log Move Out
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Operations closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Premium Move-In Drawer Panel */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Register Tenant & Log Move-In
                  </h3>
                  <p className="text-xs text-slate-400">Configure profile criteria, unit alignments, and verification documents.</p>
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

                <form onSubmit={handleAddTenant} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@rentals.com"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Phone Coordinate *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1-555-0199"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">National ID Specification</label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="SSN or Passport number"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Occupational Trade</label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Assign Vacant Space</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                    >
                      <option value="">Do Not Assign Space Yet</option>
                      {vacantUnits.map((u) => (
                        <option key={u.id} value={u.id}>Unit {u.unitNumber} (${Number(u.rentAmount)}/mo) in {u.property?.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Move-In Date</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2 border-t border-slate-850 pt-4 mt-2 grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Doc Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                      >
                        <option value="PASSPORT">Passport</option>
                        <option value="NATIONAL_ID">National ID</option>
                        <option value="AGREEMENT">Lease Agreement</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Doc Cloud Link</label>
                      <input
                        type="text"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="e.g. Cloudinary document link URL"
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-mono"
                      />
                    </div>
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
                      {submitting ? 'Registering...' : 'Confirm Move-In Process'}
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

export default function TenantsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading tenants workspace...</div>
        </div>
      </div>
    }>
      <TenantsContent />
    </Suspense>
  );
}
