'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import { 
  Building, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Edit3, 
  MapPin, 
  Layers, 
  User, 
  Calendar,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

const PRESET_IMAGES = [
  { name: 'Luxury Villa', url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80' },
  { name: 'Elegant Apartment', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80' },
  { name: 'Modern Estate', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80' },
  { name: 'Highrise Complex', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80' }
];

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');

  // Form State
  const [name, setName] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [description, setDescription] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [totalFloors, setTotalFloors] = useState(1);
  const [totalUnits, setTotalUnits] = useState(0);
  const [yearBuilt, setYearBuilt] = useState<number>(2022);
  const [managerName, setManagerName] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchProperties();
  }, [router]);

  const fetchProperties = async () => {
    try {
      const data = await apiRequest('properties');
      setProperties(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('properties', {
        method: 'POST',
        body: JSON.stringify({
          name,
          propertyCode,
          propertyType,
          description,
          addressLine1,
          city,
          state,
          postalCode,
          totalFloors: Number(totalFloors),
          totalUnits: Number(totalUnits),
          yearBuilt: Number(yearBuilt),
          managerName,
          imageUrls: [imageUrl || PRESET_IMAGES[0].url],
        }),
      });

      // Log activity to audit security log
      try {
        await apiRequest('activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action: `Property Asset Added: ${name}`,
            entityType: 'PROPERTY',
            entityId: propertyCode,
            performedBy: managerName || 'Staff Owner',
          })
        });
      } catch {
        // Fallback silently if logger is decoupled
      }

      // Reset
      setName('');
      setPropertyCode('');
      setDescription('');
      setAddressLine1('');
      setCity('');
      setState('');
      setPostalCode('');
      setTotalFloors(1);
      setTotalUnits(0);
      setManagerName('');
      setImageUrl(PRESET_IMAGES[0].url);
      setShowAddForm(false);
      fetchProperties();
    } catch (err: any) {
      setError(err.message || 'Failed to register property complex');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: string, propName: string) => {
    if (!confirm(`Are you absolutely sure you want to soft-delete "${propName}" asset? All unit linkages will be restricted.`)) return;

    try {
      await apiRequest(`properties/${id}`, { method: 'DELETE' });
      fetchProperties();
    } catch {
      // Fallback
    }
  };

  // Perform client side search, filter, and sorting for immediate response (Optimistic SaaS UX)
  const processedProperties = properties
    .filter(prop => {
      const matchesSearch = 
        prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.propertyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'ALL' || prop.propertyType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'units-desc') return b.totalUnits - a.totalUnits;
      if (sortBy === 'units-asc') return a.totalUnits - b.totalUnits;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <div className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Loading properties assets...</div>
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
              <Building className="w-8 h-8 text-indigo-400" />
              Properties Portfolio
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage and audit your multi-tenant real estate complexes, floors, and manager allocations.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Property Asset
          </button>
        </section>

        {/* Premium Filters & Command Bar - Linear / Stripe Style */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0c0e1e]/40 border border-slate-800/80 rounded-xl p-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties by name, unique code, or city..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="ALL">All Property Types</option>
              <option value="APARTMENT">Apartments</option>
              <option value="VILLA">Villas</option>
              <option value="COMMERCIAL">Commercial Offices</option>
              <option value="HOSTEL">Hostels</option>
              <option value="MIXED_USE">Mixed Use spaces</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500/40 transition-all"
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="units-desc">Sort: Units (High-Low)</option>
              <option value="units-asc">Sort: Units (Low-High)</option>
            </select>
          </div>
        </section>

        {/* Premium Property Asset Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {processedProperties.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0c0e1e]/20 flex flex-col items-center justify-center p-6 space-y-3">
              <Building className="w-12 h-12 text-slate-600 animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-400">No matching property complexes found</p>
                <p className="text-xs text-slate-500">Refine your search keywords or register a new property asset above.</p>
              </div>
            </div>
          ) : (
            processedProperties.map((prop) => (
              <div 
                key={prop.id} 
                className="group border border-slate-800 bg-[#0c0e1e]/40 rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/30 hover:bg-[#0f1228]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual Header Image mockup */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070913] to-transparent z-10" />
                  <img 
                    src={prop.imageUrls?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'} 
                    alt={prop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="text-[10px] uppercase px-2.5 py-1 rounded bg-[#090b16] text-indigo-300 font-bold border border-indigo-500/20 font-mono shadow-md">
                      {prop.propertyType.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors tracking-tight">{prop.name}</h3>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">{prop.propertyCode}</span>
                    </div>
                    <p className="text-slate-400 text-xs flex items-center gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{prop.addressLine1}, {prop.city}, {prop.state}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-4 border-t border-slate-850">
                    <div className="space-y-1">
                      <p className="font-semibold uppercase tracking-widest text-[9px] text-slate-500 font-mono">Floors / Units</p>
                      <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-400/80" />
                        {prop.totalFloors} Floors / {prop.totalUnits} Units
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold uppercase tracking-widest text-[9px] text-slate-500 font-mono">Manager Assigned</p>
                      <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-400/80" />
                        <span className="truncate">{prop.managerName || 'Unassigned'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-850 flex justify-between gap-4">
                  <button
                    onClick={() => router.push(`/units?propertyId=${prop.id}`)}
                    className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:border-indigo-500/30 transition-all text-center"
                  >
                    View Units scaffolding
                  </button>
                  <button
                    onClick={() => handleSoftDelete(prop.id, prop.name)}
                    className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-red-950/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                    title="Soft Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Premium Property Creation Drawer Overlay */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="border border-slate-800 bg-[#0c0e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-400" />
                    Register New Property Asset
                  </h3>
                  <p className="text-xs text-slate-400">Fill in critical specifications to scaffolding property units.</p>
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

                <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Property Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sunrise Apartments"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Unique Code *</label>
                    <input
                      type="text"
                      required
                      value={propertyCode}
                      onChange={(e) => setPropertyCode(e.target.value)}
                      placeholder="e.g. PROP-SUNRISE"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Property Type</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="VILLA">Villa</option>
                      <option value="COMMERCIAL">Commercial Office</option>
                      <option value="HOSTEL">Hostel</option>
                      <option value="MIXED_USE">Mixed Use space</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Manager Allocation Name</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Sarah Operator"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="100 Parkway Avenue"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Austin"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="TX"
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="78701"
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-600 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Floors *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Year Built</label>
                      <input
                        type="number"
                        required
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Property / House Image URL</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste a custom house image URL (Unsplash, Cloudinary, etc.)"
                      className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500/40 text-slate-200 placeholder-slate-650 transition-all font-sans"
                    />
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Or Select a Premium Architectural Preset:</p>
                      <div className="grid grid-cols-4 gap-3">
                        {PRESET_IMAGES.map((img, idx) => {
                          const isSelected = imageUrl === img.url;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setImageUrl(img.url)}
                              className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/25 scale-95' : 'border-slate-850 hover:border-slate-700'
                              }`}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 py-0.5 text-[8px] font-bold text-slate-300 text-center truncate">
                                {img.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional asset background..."
                      rows={1}
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
                      {submitting ? 'Registering...' : 'Save Asset Details'}
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
