'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';

function UnitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get('propertyId');

  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);

  // Bulk Generator State
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyIdParam || '');
  const [startFloor, setStartFloor] = useState(1);
  const [endFloor, setEndFloor] = useState(5);
  const [unitsPerFloor, setUnitsPerFloor] = useState(4);
  const [unitType, setUnitType] = useState('BHK2');
  const [areaSqFt, setAreaSqFt] = useState(850);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [rentAmount, setRentAmount] = useState(1800);
  const [depositAmount, setDepositAmount] = useState(1500);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, propertyIdParam]);

  const fetchData = async () => {
    try {
      const [unitsData, propsData] = await Promise.all([
        apiRequest(propertyIdParam ? `units?propertyId=${propertyIdParam}` : 'units'),
        apiRequest('properties'),
      ]);
      setUnits(unitsData);
      setProperties(propsData);
      if (propsData.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(propsData[0].id);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // Bulk preview calculation on input change
  useEffect(() => {
    if (showBulkForm) {
      calculatePreview();
    }
  }, [startFloor, endFloor, unitsPerFloor, showBulkForm]);

  const calculatePreview = () => {
    const list: any[] = [];
    for (let floor = startFloor; floor <= endFloor; floor++) {
      for (let index = 1; index <= unitsPerFloor; index++) {
        const unitNumber = `${floor}${index.toString().padStart(2, '0')}`;
        list.push({
          floorNumber: floor,
          unitNumber,
        });
      }
    }
    setBulkPreview(list);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await apiRequest('units/bulk', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          startFloor: Number(startFloor),
          endFloor: Number(endFloor),
          unitsPerFloor: Number(unitsPerFloor),
          unitType,
          areaSqFt: Number(areaSqFt),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          rentAmount: Number(rentAmount),
          depositAmount: Number(depositAmount),
        }),
      });

      setShowBulkForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate bulk units');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Loading units configuration board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Units Workspace</h1>
            <p className="text-slate-400 text-sm mt-1">Configure and assign units within your properties</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/properties')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Back to Properties
            </button>
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg hover:shadow-indigo-500/20"
            >
              Bulk Import Units
            </button>
          </div>
        </div>

        {/* Bulk Scaffolding Panel */}
        {showBulkForm && (
          <div className="glassmorphism rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold">Bulk Scaffold Properties Units</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-indigo-500/30">
                Preview Mode Active
              </span>
            </div>

            {error && <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Controls */}
              <form onSubmit={handleBulkGenerate} className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Target Property</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Unit Type</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  >
                    <option value="BHK1">1 BHK</option>
                    <option value="BHK2">2 BHK</option>
                    <option value="BHK3">3 BHK</option>
                    <option value="STUDIO">Studio</option>
                    <option value="SHOP">Shop</option>
                    <option value="OFFICE">Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Start Floor</label>
                  <input
                    type="number"
                    min={1}
                    value={startFloor}
                    onChange={(e) => setStartFloor(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">End Floor</label>
                  <input
                    type="number"
                    min={1}
                    value={endFloor}
                    onChange={(e) => setEndFloor(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Units per Floor</label>
                  <input
                    type="number"
                    min={1}
                    value={unitsPerFloor}
                    onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Area (Sq Ft)</label>
                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Rent Amount (₹)</label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Deposit Amount (₹)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-white"
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBulkForm(false)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg"
                  >
                    Confirm Import
                  </button>
                </div>
              </form>

              {/* Preview List */}
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 flex flex-col justify-between max-h-[380px]">
                <h4 className="font-bold text-sm text-slate-400 mb-2 uppercase tracking-wide">Scaffolding Preview ({bulkPreview.length} units)</h4>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {bulkPreview.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-slate-900 rounded border border-slate-800 text-xs">
                      <span>Floor {item.floorNumber}</span>
                      <span className="font-bold text-indigo-400">Unit {item.unitNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {units.length === 0 ? (
            <div className="col-span-full text-center py-12 glassmorphism rounded-xl text-slate-400">
              No units generated yet for this property context. Click "Bulk Import Units" to generate sequentially.
            </div>
          ) : (
            units.map((unit) => (
              <div key={unit.id} className="glassmorphism rounded-xl p-6 border border-slate-750 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-850 text-slate-300 font-semibold">
                      {unit.unitType}
                    </span>
                    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                      unit.status === 'VACANT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20' : 'bg-red-950 text-red-300 border border-red-500/20'
                    }`}>
                      {unit.status.toLowerCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">Unit {unit.unitNumber}</h3>
                  <p className="text-xs text-slate-400">Floor {unit.floorNumber} • {unit.areaSqFt} SqFt</p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Rent</span>
                    <span className="font-bold"> ₹${Number(unit.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Deposit</span>
                    <span className="font-semibold text-slate-300"> ₹${Number(unit.depositAmount)}</span>
                  </div>
                </div>
                <button
                  disabled={unit.status === 'OCCUPIED'}
                  onClick={() => router.push(`/tenants?unitId=${unit.id}`)}
                  className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unit.status === 'OCCUPIED' ? 'Unit Leased' : 'Assign Tenant'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-slate-400">Loading units workspace...</div>}>
      <UnitsContent />
    </Suspense>
  );
}
