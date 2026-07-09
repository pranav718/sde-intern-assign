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
    <div className="flex min-h-screen items-center justify-center px-4 text-black antialiased selection:bg-yellow-300 selection:text-black">
      
      <div className="relative w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-[#C5BAFF] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-black uppercase tracking-tight text-black">Setu eSign Gateway</h1>
          <p className="mt-2 text-xs font-black text-black uppercase tracking-widest bg-[#4ADE80] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Sandbox Simulator
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="aadhaar" className="block text-xs font-black uppercase tracking-wider text-black">
                Aadhaar Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="aadhaar"
                  value={aadhaar}
                  onChange={handleAadhaarChange}
                  placeholder="0000 0000 0000"
                  className="w-full border-2 border-black bg-white px-4 py-3.5 text-base tracking-widest text-black placeholder-zinc-400 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>
              <p className="text-[11px] font-bold text-zinc-500">
                Tip: Enter any 12-digit number for mock validation.
              </p>
            </div>

            <div className="border-2 border-black bg-[#FFF9E6] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-none border-2 border-black bg-white text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs font-bold leading-relaxed text-black select-none">
                  I hereby consent to verify my identity and electronically sign the uploaded PDF document using Aadhaar eSign authentication services.
                </span>
              </label>
            </div>

            {error && (
              <div className="border-2 border-black bg-[#F87171] p-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center border-2 border-black bg-[#A78BFA] px-4 py-3.5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                'Request OTP'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-xs font-black uppercase tracking-wider text-black">
                Enter Verification Code (OTP)
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full text-center border-2 border-black bg-white px-4 py-3.5 text-xl font-black tracking-widest text-black placeholder-zinc-400 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                required
              />
              <p className="text-[11px] font-bold text-zinc-500 text-center">
                OTP sent to registered Aadhaar mobile. Type any 6 digits to proceed.
              </p>
            </div>

            {error && (
              <div className="border-2 border-black bg-[#F87171] p-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}

            <div className="flex gap-3 font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-black bg-white px-4 py-3.5 text-sm uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center border-2 border-black bg-[#4ADE80] px-4 py-3.5 text-sm uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  'Verify & Sign'
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="relative flex h-16 w-16 items-center justify-center border-4 border-black bg-[#4ADE80] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-black">Document Signed Successfully</h2>
              <p className="mt-2 text-sm font-bold text-zinc-600">
                Simulating secure cryptographic sealing...
              </p>
              <p className="mt-2 text-xs font-bold text-zinc-500 animate-pulse">
                Redirecting back to your application in a moment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
