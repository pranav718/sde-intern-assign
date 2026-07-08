'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface UploadResponse {
  documentId: string;
  signatureId: string;
  signatureUrl: string;
  status: string;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [result, setResult] = useState<UploadResponse | null>(null);
  
  // iframe modal state
  const [showIframeModal, setShowIframeModal] = useState(false);
  const [signingStatus, setSigningStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // validate and set file
  const validateAndSetFile = (selectedFile: File) => {
    setUploadError(null);
    setResult(null);

    if (selectedFile.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size exceeds the limit of 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    // simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', file.name);

      const response = await fetch('/api/upload-contract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload contract');
      }

      // short delay to show 100% completion before rendering result
      setTimeout(() => {
        setResult(data);
        setUploading(false);
      }, 300);

    } catch (err: any) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadError(err.message || 'An unexpected error occurred during upload.');
    }
  };

  // poll signature status while iframe is open
  useEffect(() => {
    if (!result || !showIframeModal) return;

    setSigningStatus('PENDING');
    let delay = 1500;
    let timerId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/signature-status/${result.signatureId}`);
        const data = await res.json();
        
        if (data.status === 'COMPLETED' || data.status === 'sign_complete') {
          setSigningStatus('COMPLETED');
          
          // auto close iframe modal after a brief delay showing completion checkmark
          setTimeout(() => {
            setShowIframeModal(false);
          }, 1500);
        } else {
          timerId = setTimeout(checkStatus, delay);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        timerId = setTimeout(checkStatus, delay);
      }
    };

    timerId = setTimeout(checkStatus, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [showIframeModal, result]);

  const handleDownload = () => {
    if (!result) return;
    window.open(`/api/download/${result.documentId}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-zinc-50 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-3/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl flex flex-col">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-100">
            Upload & Sign Contracts
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto">
            Securely upload agreement files in PDF format, set signers, and complete authentication using simulated eSign gateways.
          </p>
        </div>

        {!result && (
          <div className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 backdrop-blur-xl shadow-xl shadow-black/30">
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-violet-500 bg-violet-500/5 scale-[0.99]'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>

              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-200 max-w-[300px] truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-300">Drag & drop your PDF contract here</p>
                  <p className="text-xs text-zinc-600 mt-1">or click to browse files (max 5MB)</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {uploadError}
              </div>
            )}

            {file && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
                >
                  Clear File
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Uploading ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <span>Upload & Setup Signature</span>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

        {result && (
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-xl shadow-xl shadow-black/30 relative">
            
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-violet-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-100 truncate">
                  {file?.name || 'Contract Document'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Ready for signature authentication</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  signingStatus === 'COMPLETED'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                }`}>
                  {signingStatus}
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800/80 pt-6 text-zinc-400 text-xs">
              <div className="space-y-1">
                <span className="block font-semibold uppercase tracking-wider text-zinc-500 text-[10px]">Document ID</span>
                <span className="font-mono text-zinc-200 select-all">{result.documentId}</span>
              </div>
              <div className="space-y-1">
                <span className="block font-semibold uppercase tracking-wider text-zinc-500 text-[10px]">Signature ID</span>
                <span className="font-mono text-zinc-200 select-all">{result.signatureId}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-900">
              
              {signingStatus === 'PENDING' ? (
                <>
                  <button
                    onClick={() => setShowIframeModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/15 hover:bg-violet-500 transition duration-200"
                  >
                    <span>Sign in Embedded Iframe</span>
                  </button>
                  <a
                    href={result.signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition duration-200"
                  >
                    <span>Sign in New Tab</span>
                  </a>
                </>
              ) : (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-500 transition duration-200 animate-fade-in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Signed PDF</span>
                </button>
              )}

            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setSigningStatus('PENDING');
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline transition"
              >
                Upload another contract
              </button>
            </div>

          </div>
        )}

      </div>

      {showIframeModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-2xl h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden shadow-2xl">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  eSign Secure Iframe Session
                </span>
              </div>
              <button
                onClick={() => setShowIframeModal(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 bg-zinc-900 relative">
              {signingStatus === 'COMPLETED' ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-6 space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-100">Verification Complete</h4>
                    <p className="text-xs text-zinc-500 mt-1">Successfully signed document. Closing iframe...</p>
                  </div>
                </div>
              ) : null}
              
              <iframe
                src={`${result.signatureUrl}&redirect_to=${encodeURIComponent(window.location.origin + '/callback')}`}
                className="w-full h-full border-none"
                title="Mock eSign Gateway"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
