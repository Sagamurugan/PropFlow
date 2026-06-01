'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('notifications');
      setNotifications(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch {
      // Handle error
    }
  };

  const triggerExpiryCheck = async () => {
    try {
      await apiRequest('leases/trigger-expiry-check', { method: 'POST' });
      fetchNotifications();
      alert('Lease expiry checks complete. Expiring alert notifications successfully dispatched.');
    } catch {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="text-xl text-slate-400 animate-pulse">Loading notification feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Notification Center</h1>
            <p className="text-slate-400 text-sm mt-1">Audit operational alerts, billing milestones, and repair requests</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={triggerExpiryCheck}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
            >
              Run Expiry Check
            </button>
          </div>
        </div>

        {/* List Feed */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 glassmorphism rounded-xl text-slate-400">
              Your inbox is completely clear. No active alerts reported.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`glassmorphism rounded-xl p-6 border transition-all ${
                  notif.isRead ? 'opacity-65 border-slate-850' : 'border-indigo-500/20 shadow-md shadow-indigo-500/5'
                } flex items-start justify-between gap-6`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs uppercase px-2 py-0.5 rounded font-bold ${
                      notif.type === 'LEASE' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/20' :
                      notif.type === 'PAYMENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20' :
                      'bg-slate-850 text-slate-300'
                    }`}>
                      {notif.type.toLowerCase()}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{notif.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{notif.message}</p>
                  
                  {notif.isRead && notif.readAt && (
                    <p className="text-[10px] text-slate-500 italic">Read on: {new Date(notif.readAt).toLocaleString()}</p>
                  )}
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/20 transition-all whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-slate-400">Loading inbox...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
