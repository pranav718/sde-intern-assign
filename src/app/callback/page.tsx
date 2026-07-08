'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CallbackContent() {
  const searchParams = useSearchParams();
  
  const id = searchParams.get('id') || '';
  const success = searchParams.get('success') === 'true';
  const errorMessage = searchParams.get('errorMessage') || '';

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-xl shadow-2xl text-center">
      {success ? (
        <div className="space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Signature Complete</h1>
            <p className="mt-2 text-xs text-zinc-400">
              Your Aadhaar eSign verification succeeded! The cryptographically sealed document is now ready.
            </p>
          </div>

          <div className="bg-zinc-950/60 rounded-xl border border-zinc-850 p-4 font-mono text-[10px] text-zinc-400 select-all">
            <span className="block text-zinc-500 uppercase tracking-wider text-[9px] font-semibold mb-1">Signature Session ID</span>
            {id}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/status"
              className="flex-1 text-center rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              View History Log
            </Link>
            <Link
              href="/"
              className="flex-1 text-center rounded-xl bg-violet-600 py-3 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition"
            >
              Upload New Doc
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Signature Failed</h1>
            <p className="mt-2 text-xs text-zinc-400">
              {errorMessage || 'eSign verification failed or was cancelled by the user.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="block w-full text-center rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 px-6 py-20 text-zinc-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Suspense fallback={
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-xs text-zinc-500 mt-3">Loading session details...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
export const dynamic = 'force-dynamic';
