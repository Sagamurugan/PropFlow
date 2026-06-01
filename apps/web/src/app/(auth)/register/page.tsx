'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { Building, Shield, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  // Registration Type state
  const [regType, setRegType] = useState<'NEW_ORG' | 'JOIN_ORG'>('NEW_ORG');
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'TENANT'>('TENANT');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  // Loaded organizations
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [regType]);

  const fetchOrganizations = async () => {
    try {
      const data = await apiRequest('auth/organizations');
      setOrganizations(data || []);
      if (data && data.length > 0) {
        setSelectedOrgId(data[0].id);
      }
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      email,
      password,
      firstName,
      lastName,
    };

    if (regType === 'NEW_ORG') {
      payload.organizationName = organizationName;
    } else {
      payload.organizationId = selectedOrgId;
      payload.role = selectedRole;
    }

    try {
      await apiRequest('auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input parameters.');
    } finally {
      setLoading(false);
    }
  };

  const regMeta = {
    NEW_ORG: {
      title: 'Landlord / Owner Account',
      desc: 'Form a new real estate organization context to register properties, units, and custom lease conditions.',
      icon: <Building className="w-5 h-5 text-indigo-400" />,
    },
    JOIN_ORG: {
      title: `${selectedRole === 'MANAGER' ? 'Property Manager' : 'Tenant'} Registration`,
      desc: `Register your user profile as a ${selectedRole.toLowerCase()} mapping directly into an active, managed organization portfolio.`,
      icon: selectedRole === 'MANAGER' ? <Shield className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-emerald-400" />,
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913] text-slate-100 px-4 py-12 select-none relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-xl glassmorphism rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-9 w-9 rounded-xl bg-indigo-600 items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-sm mx-auto mb-2">
            PF
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Register for <span className="gradient-text">PropFlow AI</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Initialize a new property workspace or sign up to a managed complex.
          </p>
        </div>

        {/* Tab switcher: New Organization vs Join Organization */}
        <div className="bg-slate-950/60 p-1 border border-slate-800/60 rounded-xl grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => {
              setRegType('NEW_ORG');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              regType === 'NEW_ORG'
                ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Organization
          </button>
          <button
            type="button"
            onClick={() => {
              setRegType('JOIN_ORG');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              regType === 'JOIN_ORG'
                ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Join Organization
          </button>
        </div>

        {/* Custom description */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-1.5 transition-all">
          <div className="flex items-center gap-2">
            {regMeta[regType].icon}
            <span className="text-xs font-bold text-slate-200 tracking-wide">{regMeta[regType].title}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {regMeta[regType].desc}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-lg text-red-200 text-xs font-medium leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-emerald-200 text-xs font-medium leading-relaxed">
            🎉 Account successfully registered! Redirecting to workspace login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Join Org Sub-tab role selector */}
          {regType === 'JOIN_ORG' && (
            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-800/40">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500/40"
                >
                  <option value="TENANT">Tenant / Renter</option>
                  <option value="MANAGER">Property Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Select Organization
                </label>
                {organizations.length > 0 ? (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 pt-2 italic">No organizations available. Create one first!</div>
                )}
              </div>
            </div>
          )}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
              />
            </div>
          </div>

          {/* Org Name (only for NEW_ORG) */}
          {regType === 'NEW_ORG' && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Apex Property Complexes"
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@propflow.ai"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Secure Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (Min 6 characters)"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success || (regType === 'JOIN_ORG' && !selectedOrgId)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {loading ? 'Registering...' : regType === 'NEW_ORG' ? 'Create Organization Workspace' : `Register as ${selectedRole.toLowerCase()}`}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/60">
          Already registered?{' '}
          <a href="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In to Workspace
          </a>
        </div>
      </div>
    </div>
  );
}
