'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
        <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto text-teal-400 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            404 - Resource Out of Range
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            The instance or clinical ledger route you are attempting to synchronize does not exist or has been secure-migrated.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold shadow-lg shadow-teal-500/10 transition-all duration-200 active:scale-[0.98]"
          >
            Reconnect Core Instance
          </Link>
        </div>
      </div>
    </div>
  );
}
