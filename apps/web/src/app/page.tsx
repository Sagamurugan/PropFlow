import React from 'react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-3xl glassmorphism rounded-2xl p-8 md:p-12 shadow-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Welcome to <span className="gradient-text">PropFlow AI</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-xl mx-auto">
          The production-grade, multi-tenant property and rental management platform supercharged by AI Lease Intelligence.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
          >
            Enter Dashboard
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors duration-200"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
