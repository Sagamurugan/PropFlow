'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getUserSession } from '../../lib/api';
import Navbar from '../../components/layouts/Navbar';
import {
  Sparkles,
  Send,
  Building,
  Home,
  AlertTriangle,
  Wrench,
  HelpCircle,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

function formatMessageText(text: string) {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Replace bullet asterisks at the start of a line
    let processed = line.replace(/^\s*\*\s+/g, '• ');
    // Replace bold asterisks
    processed = processed.replace(/\*\*(.*?)\*\*/g, '$1');
    // Remove any loose single asterisks
    processed = processed.replace(/\*/g, '');
    return <p key={idx} className="min-h-[1.2em]">{processed}</p>;
  });
}

export default function AssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LocalStorage API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyBox, setShowApiKeyBox] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey =
        localStorage.getItem('pf_ai_api_key') ||
        localStorage.getItem('pf_gemini_api_key') ||
        '';
      setApiKeyInput(savedKey);
      if (savedKey) setKeySaved(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pf_ai_api_key', apiKeyInput);
      setKeySaved(!!apiKeyInput);
      setShowApiKeyBox(false);
    }
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.role === 'TENANT') {
      router.push('/dashboard'); // Restrict tenants from portfolio-wide safe queries
      return;
    }
    setUser(session);

    // Initial system greeting
    setMessages([
      {
        role: 'system',
        text: `Welcome to the PropFlow AI Command Center, ${session.firstName}. I am your secure Property Intelligence Assistant, isolated strictly to organization boundary **${session.organizationId}**. You can query anything using plain natural language.`,
        intent: 'GENERAL_HELP',
      }
    ]);
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend?: string) => {
    const activeQuery = textToSend || query;
    if (!activeQuery.trim()) return;

    const userMsg = { role: 'user', text: activeQuery };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const data = await apiRequest('ai/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ query: activeQuery }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.response,
          intent: data.intent,
          filters: data.filters,
          data: data.data,
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Query Execution Error: ${err.message || 'We could not process that request. Make sure the API server is active.'}`,
          intent: 'ERROR',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    { text: 'Which house units are currently vacant?', icon: <Home className="w-3.5 h-3.5 text-indigo-400" /> },
    { text: 'Who has outstanding overdue rent?', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'List active maintenance trade tickets', icon: <Wrench className="w-3.5 h-3.5 text-pink-400" /> },
    { text: 'Show all properties in the organization', icon: <Building className="w-3.5 h-3.5 text-emerald-400" /> },
    { text: 'Give me a high-level portfolio summary', icon: <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <div className="min-h-screen grid-bg text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 h-[calc(100vh-80px)]">
        
        {/* Playful Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              AI Command Assistant
            </h1>
            <p className="text-xs text-slate-400">Secure, non-SQL injecting natural language safe query interface isolated to your multi-tenant organization.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg font-mono tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Tenant Isolated
          </div>
        </section>
        {/* API Key Banner Indicator */}
        <div className="bg-[#0c0e1e]/60 border border-slate-850 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${keySaved ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-slate-400 font-medium">
              {keySaved 
                ? 'Gemini API Key: Loaded from Secure Client Storage.' 
                : 'Gemini API Key missing! Set custom key to bypass placeholder checks.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyBox(!showApiKeyBox)}
              className="text-indigo-400 hover:text-indigo-300 font-bold tracking-wide"
            >
              {showApiKeyBox ? 'Close Settings' : 'Configure API Key ⚙️'}
            </button>
          </div>
        </div>

        {showApiKeyBox && (
          <div className="bg-[#0c0e1e]/80 border border-indigo-500/20 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
            <p className="text-xs text-slate-400 leading-relaxed">
              If no server-side AI key is configured, you can supply your own Gemini or Groq API key below. It will be stored in your browser and used dynamically for AI calls.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste your Gemini or Groq API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 px-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/40 transition-all font-mono"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Key
              </button>
            </div>
          </div>
        )}
        {/* Chat Interface Console */}
        <section className="flex-1 min-h-0 premium-card rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          {/* Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="p-2 border border-indigo-500/20 bg-indigo-950/30 rounded-xl text-indigo-400 flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`space-y-4 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {/* Chat bubble text */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white font-semibold rounded-tr-none shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-900/60 border border-slate-850 rounded-tl-none text-slate-200'
                    }`}
                  >
                    {formatMessageText(msg.text)}
                  </div>

                  {/* Render Custom dynamic dataset widgets depending on parsed query results */}
                  {msg.role !== 'user' && msg.data && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 mt-2">
                      
                      {/* LIST_PROPERTIES rendering */}
                      {msg.intent === 'LIST_PROPERTIES' && Array.isArray(msg.data) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl font-sans">
                          {msg.data.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No properties registered.</p>
                          ) : (
                            msg.data.map((prop: any) => (
                              <div key={prop.id} className="p-4 rounded-xl border border-slate-800 bg-[#0e1124]/40 hover:border-indigo-500/20 transition-all flex items-center justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                                    {prop.name}
                                  </h4>
                                  <p className="text-[10px] text-slate-500">{prop.addressLine1}, {prop.city}</p>
                                </div>
                                <span className="text-[10px] bg-indigo-900/30 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/10 font-mono">
                                  {prop.totalUnits} Units
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* LIST_VACANT_UNITS rendering */}
                      {msg.intent === 'LIST_VACANT_UNITS' && Array.isArray(msg.data) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                          {msg.data.length === 0 ? (
                            <p className="text-xs text-slate-500 italic font-mono">Zero vacant spaces available.</p>
                          ) : (
                            msg.data.map((unit: any) => (
                              <div key={unit.id} className="p-4 rounded-xl border border-slate-800 bg-[#0e1124]/40 hover:border-indigo-500/20 transition-all flex flex-col justify-between h-28">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                    <Home className="w-3.5 h-3.5 text-indigo-400" />
                                    Unit {unit.unitNumber}
                                  </h4>
                                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.5 rounded tracking-wide font-mono uppercase">
                                    {unit.status.toLowerCase()}
                                  </span>
                                </div>
                                <div className="space-y-0.5 mt-2">
                                  <p className="text-[10px] text-indigo-300 font-semibold truncate">{unit.property?.name}</p>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                                    <span>{unit.unitType} | {unit.areaSqFt} SqFt</span>
                                    <span className="font-bold text-slate-200">₹{Number(unit.rentAmount)}/mo</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* LIST_OVERDUE_PAYMENTS rendering */}
                      {msg.intent === 'LIST_OVERDUE_PAYMENTS' && Array.isArray(msg.data) && (
                        <div className="space-y-3 max-w-xl">
                          {msg.data.length === 0 ? (
                            <p className="text-xs text-slate-500 italic font-mono">No overdue rent collections pending.</p>
                          ) : (
                            msg.data.map((rec: any) => (
                              <div key={rec.id} className="p-3.5 rounded-xl border border-red-500/25 bg-red-950/10 flex items-center justify-between">
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {rec.tenant?.firstName} {rec.tenant?.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Statement Month: <span className="font-mono font-bold">{rec.month}</span> | Due: {new Date(rec.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-400 font-mono">₹{Number(rec.balance)}</p>
                                  <span className="text-[8px] bg-red-900/20 border border-red-500/10 text-red-300 font-bold px-1.5 py-0.5 rounded tracking-wide font-mono uppercase">
                                    overdue
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* LIST_MAINTENANCE_TICKETS rendering */}
                      {msg.intent === 'LIST_MAINTENANCE_TICKETS' && Array.isArray(msg.data) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl font-sans">
                          {msg.data.length === 0 ? (
                            <p className="text-xs text-slate-500 italic font-mono">No active repair tickets pending.</p>
                          ) : (
                            msg.data.map((ticket: any) => (
                              <div key={ticket.id} className="p-4 rounded-xl border border-slate-800 bg-[#0e1124]/40 hover:border-indigo-500/20 transition-all flex flex-col justify-between h-32">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xs font-bold text-slate-200 truncate max-w-[150px]">
                                    {ticket.category} Trade Issue
                                  </h4>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                    ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                                      ? 'bg-red-950 text-red-400 border-red-500/20 animate-pulse'
                                      : 'bg-indigo-950 text-indigo-300 border-indigo-500/20'
                                  }`}>
                                    {ticket.priority.toLowerCase()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">"{ticket.description}"</p>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                                  <span>Ticket #{ticket.ticketNumber}</span>
                                  <span className="font-bold text-slate-300">{ticket.status}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* PROPERTY_STATISTICS rendering */}
                      {msg.intent === 'PROPERTY_STATISTICS' && msg.data && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl">
                          <div className="p-3 bg-[#0c0e1e]/60 border border-slate-850 rounded-lg">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Properties Portfolio</p>
                            <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">{msg.data.propertiesCount}</p>
                          </div>
                          <div className="p-3 bg-[#0c0e1e]/60 border border-slate-850 rounded-lg">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Occupancy Scale</p>
                            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{msg.data.occupancyRate}%</p>
                          </div>
                          <div className="p-3 bg-[#0c0e1e]/60 border border-slate-850 rounded-lg">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Overdue Accounts</p>
                            <p className="text-lg font-bold text-red-400 font-mono mt-0.5">{msg.data.pendingPaymentsCount}</p>
                          </div>
                          <div className="p-3 bg-[#0c0e1e]/60 border border-slate-850 rounded-lg">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending Work Orders</p>
                            <p className="text-lg font-bold text-amber-500 font-mono mt-0.5">{msg.data.openMaintenanceTickets}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="p-2 border border-slate-800 bg-[#0e1124] rounded-xl text-slate-300 flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 items-start animate-pulse">
                <div className="p-2 border border-indigo-500/20 bg-indigo-950/30 rounded-xl text-indigo-400 flex-shrink-0">
                  <Bot className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-2">
                  <div className="h-9 w-48 bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none" />
                  <div className="text-[10px] text-indigo-400 font-semibold font-mono animate-pulse">Assistant is executing safe organization query...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts Selector */}
          <div className="px-6 py-3 bg-slate-950/20 border-t border-slate-850 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono mr-2">Suggested queries:</span>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(prompt.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-indigo-500/30 bg-slate-900/60 hover:bg-[#0e1124] rounded-full text-xs text-slate-300 hover:text-indigo-300 font-medium transition-all"
              >
                {prompt.icon}
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Input Console Area */}
          <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              placeholder="Query units occupancy, pending bills, maintenance tickest or summarize portfolio..."
              className="flex-1 px-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 text-white hover:shadow-lg hover:shadow-indigo-600/10 rounded-xl transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
