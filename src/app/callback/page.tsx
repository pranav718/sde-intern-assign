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
    <div className="relative w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
      {success ? (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-4 border-black bg-[#4ADE80] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-xl font-black uppercase text-black">Signature Complete</h1>
            <p className="mt-2 text-xs font-bold text-zinc-650">
              Your Aadhaar eSign verification succeeded! The cryptographically sealed document is now ready.
            </p>
          </div>

          <div className="bg-[#FFF9E6] border-2 border-black p-4 font-mono text-[10px] text-black select-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
            <span className="block text-zinc-600 uppercase tracking-wider text-[9px] font-bold mb-1">Signature Session ID</span>
            {id}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 font-bold">
            <Link
              href="/status"
              className="flex-1 text-center border-2 border-black bg-white py-3 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Statuses
            </Link>
            <Link
              href="/"
              className="flex-1 text-center border-2 border-black bg-[#A78BFA] py-3 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Upload New
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-4 border-black bg-[#F87171] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-xl font-black uppercase text-black">Signature Failed</h1>
            <p className="mt-2 text-xs font-bold text-zinc-650">
              {errorMessage || 'eSign verification failed or was cancelled by the user.'}
            </p>
          </div>

          <div className="pt-2 font-bold">
            <Link
              href="/"
              className="block w-full text-center border-2 border-black bg-white py-3 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-black relative">
      
      <Suspense fallback={
        <div className="relative w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center py-20 font-bold">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p className="text-xs text-zinc-655 mt-3">Loading session details...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
export const dynamic = 'force-dynamic';
