'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">System Exception</h2>
            <p className="text-slate-400 text-sm">
              Zara OS encountered a runtime exception. The error has been logged securely under compliance protocols.
            </p>
          </div>
          {error.message && (
            <pre className="text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-left overflow-x-auto font-mono text-red-300">
              {error.message}
            </pre>
          )}
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition"
          >
            Reset System Instance
          </button>
        </div>
      </body>
    </html>
  );
}
