'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function MockSetuGateway() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const signatureId = params.id as string;
  const redirectUrlParam = searchParams.get('redirect_to'); // optional override

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: consent & aadhaar, 2: otp, 3: success/redirecting
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // format aadhaar input with spaces: XXXX XXXX XXXX
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaar(formatted);
    setError(null);
  };

  // format otp input: 6 digits
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(null);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAadhaar = aadhaar.replace(/\s/g, '');
    
    if (rawAadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!consent) {
      setError('You must provide your consent to proceed');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500); // simulate SMS sending
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // call mock complete api to update status in database
      const response = await fetch('/api/mock-setu/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete eSign');
      }

      setStep(3);
      setLoading(false);

      // simulate cryptographic processing before redirecting
      setTimeout(() => {
        const finalRedirect = redirectUrlParam || 'https://google.com';
        // append callback parameters just like setu does on redirect
        const redirectUrl = new URL(finalRedirect);
        redirectUrl.searchParams.set('id', signatureId);
        redirectUrl.searchParams.set('success', 'true');
        
        window.location.href = redirectUrl.toString();
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An unexpected error occurred during signature verification');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-50 antialiased selection:bg-violet-500/30 selection:text-violet-200">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
        
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700 text-violet-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">Setu eSign Gateway</h1>
          <p className="mt-1.5 text-xs font-medium text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
            Sandbox Simulator
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="aadhaar" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Aadhaar Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="aadhaar"
                  value={aadhaar}
                  onChange={handleAadhaarChange}
                  placeholder="0000 0000 0000"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3.5 text-base tracking-widest text-zinc-100 placeholder-zinc-700 outline-none transition duration-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Tip: Enter any 12-digit number for mock validation.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-violet-600 focus:ring-violet-500 focus:ring-offset-zinc-900 cursor-pointer"
                />
                <span className="text-xs leading-relaxed text-zinc-400 select-none">
                  I hereby consent to verify my identity and electronically sign the uploaded PDF document using Aadhaar eSign authentication services.
                </span>
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 outline-none transition duration-200 hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Request OTP'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Enter Verification Code (OTP)
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full text-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3.5 text-xl font-bold tracking-widest text-zinc-100 placeholder-zinc-700 outline-none transition duration-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                required
              />
              <p className="text-[11px] text-zinc-500 text-center">
                OTP sent to registered Aadhaar mobile. Type any 6 digits to proceed.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3.5 text-sm font-semibold text-zinc-400 outline-none transition duration-200 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 outline-none transition duration-200 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Verify & Sign'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <div className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-25" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Document Signed Successfully</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Simulating secure cryptographic sealing...
              </p>
              <p className="mt-1.5 text-xs text-zinc-500 animate-pulse">
                Redirecting back to your application in a moment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
