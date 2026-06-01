'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setTokens, saveUserSession, getUserSession } from '../../../lib/api';
import { Building, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'OWNER' | 'MANAGER' | 'TENANT'>('OWNER');

  useEffect(() => {
    // Redirect if session already exists
    const session = getUserSession();
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setTokens(data.accessToken, data.refreshToken);
      saveUserSession(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'OWNER' | 'MANAGER' | 'TENANT') => {
    setError(null);
    let demoEmail = '';
    if (role === 'OWNER') demoEmail = 'owner@propflow.ai';
    if (role === 'MANAGER') demoEmail = 'manager@propflow.ai';
    if (role === 'TENANT') demoEmail = 'tenant@propflow.ai';

    setEmail(demoEmail);
    setPassword('password');
    setActiveRole(role);
  };

  const roleMeta = {
    OWNER: {
      title: 'Landlord / Owner Portal',
      desc: 'Access your full real estate portfolio, check dynamic occupancy comps, and review financial metrics.',
      icon: <Building className="w-5 h-5 text-indigo-400" />,
      accent: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
    },
    MANAGER: {
      title: 'Property Manager Portal',
      desc: 'Dispatch trade technicians, review lease renewals, track pending repairs, and audit monthly collections.',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      accent: 'border-purple-500 bg-purple-500/10 text-purple-300',
    },
    TENANT: {
      title: 'Tenant Customer Space',
      desc: 'Check outstanding rent balances, log digital maintenance tickets, and track lease dates.',
      icon: <User className="w-5 h-5 text-emerald-400" />,
      accent: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070913] text-slate-100 px-4 py-12 select-none relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-lg glassmorphism rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-9 w-9 rounded-xl bg-indigo-600 items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-sm mx-auto mb-2">
            PF
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Welcome to <span className="gradient-text">PropFlow AI</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            A production-grade multi-tenant property management platform.
          </p>
        </div>

        {/* Premium Role Switcher Tabs */}
        <div className="bg-slate-950/60 p-1 border border-slate-800/60 rounded-xl grid grid-cols-3 gap-1">
          {(['OWNER', 'MANAGER', 'TENANT'] as const).map((role) => {
            const isActive = activeRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setActiveRole(role);
                  setEmail('');
                  setPassword('');
                }}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* Dynamic Card Meta info */}
        <div className={`p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-1.5 transition-all duration-300`}>
          <div className="flex items-center gap-2">
            {roleMeta[activeRole].icon}
            <span className="text-xs font-bold text-slate-200 tracking-wide">{roleMeta[activeRole].title}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {roleMeta[activeRole].desc}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-lg text-red-200 text-xs font-medium leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {/* Quick Demo Autofill Button */}
        <button
          type="button"
          onClick={() => handleQuickLogin(activeRole)}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow"
        >
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          Auto-fill {activeRole === 'OWNER' ? 'Owner' : activeRole === 'MANAGER' ? 'Manager' : 'Tenant'} Demo Credentials
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-full border-t border-slate-800/80" />
          <span className="relative px-3 bg-[#0c0f1d] text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Secure Credentials
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-lg focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-600 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/60">
          Want to start a new real estate context?{' '}
          <a href="/register" className="text-indigo-400 hover:underline font-semibold">
            Register Organization
          </a>
        </div>
      </div>
    </div>
  );
}
