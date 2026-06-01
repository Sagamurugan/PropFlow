'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest, getUserSession, getRefreshToken, clearTokens } from '../../lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);

  useEffect(() => {
    const session = getUserSession();
    if (session) {
      setUser(session);
    }
    fetchNotificationsCount();
  }, []);

  const fetchNotificationsCount = async () => {
    try {
      const notifications = await apiRequest('notifications');
      const unread = notifications.filter((n: any) => !n.isRead).length;
      setUnreadNotificationsCount(unread);
    } catch {
      // Silently fall back
    }
  };

  const handleLogout = async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await apiRequest('auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh }),
        });
      }
    } catch {
      // Fallback
    } finally {
      clearTokens();
      router.push('/login');
    }
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', roles: ['OWNER', 'MANAGER', 'TENANT'] },
    { label: 'AI Assistant', path: '/ai-assistant', roles: ['OWNER', 'MANAGER'] },
    { label: 'Properties', path: '/properties', roles: ['OWNER', 'MANAGER'] },
    { label: 'Units', path: '/units', roles: ['OWNER', 'MANAGER'] },
    { label: 'Tenants', path: '/tenants', roles: ['OWNER', 'MANAGER'] },
    { label: 'Leases', path: '/leases', roles: ['OWNER', 'MANAGER'] },
    { label: 'Payments', path: '/payments', roles: ['OWNER', 'MANAGER', 'TENANT'] },
    { label: 'Maintenance', path: '/maintenance', roles: ['OWNER', 'MANAGER', 'TENANT'] },
    { label: 'Reports', path: '/reports', roles: ['OWNER', 'MANAGER'] },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (!user || !user.role) return true;
    return link.roles.includes(user.role);
  });

  return (
    <header className="glassmorphism sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-lg border-b border-slate-800 bg-[#0b0f19]/85 backdrop-blur-md">
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
            PF
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight gradient-text">PropFlow AI</span>
            <span className="ml-2 hidden sm:inline-block text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-indigo-500/30">
              Operations Active
            </span>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            🔔
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex flex-wrap items-center gap-1 mt-4 md:mt-0 justify-center">
        {visibleLinks.map(link => {
          const isActive = pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          );
        })}

        {/* Analytics Dropdown */}
        {user && user.role !== 'TENANT' && (
          <div className="relative">
            <button
              onClick={() => setShowAnalyticsDropdown(!showAnalyticsDropdown)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                pathname.startsWith('/analytics')
                  ? 'bg-indigo-950 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Analytics ▾
            </button>
            {showAnalyticsDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 flex flex-col gap-1">
                {[
                  { label: 'Revenue', path: '/analytics/revenue' },
                  { label: 'Occupancy', path: '/analytics/occupancy' },
                  { label: 'Lease Expiries', path: '/analytics/leases' },
                  { label: 'Maintenance', path: '/analytics/maintenance' },
                ].map(sub => (
                  <button
                    key={sub.path}
                    onClick={() => {
                      router.push(sub.path);
                      setShowAnalyticsDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      pathname === sub.path
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Session Profile & Controls */}
      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={() => router.push('/notifications')}
          className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
        >
          🔔
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border-2 border-[#0b0f19] text-[10px] font-bold flex items-center justify-center text-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
        {user && (
          <div className="text-right">
            <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-indigo-400 capitalize font-medium">{user.role.toLowerCase()}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors duration-200"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
