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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-black relative">
      
      <div className="relative w-full max-w-2xl flex flex-col">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-black uppercase border-4 border-black bg-white px-6 py-3 shadow-[6px_6px_0px_0px_#000] inline-block">
            Upload & Sign Contracts
          </h1>
          <p className="mt-5 text-sm font-bold text-zinc-700 max-w-lg mx-auto bg-[#FFF9E6] border-2 border-black p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Securely upload agreement files in PDF format, set signers, and complete authentication using simulated eSign gateways.
          </p>
        </div>

        {!result && (
          <div className="w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center py-12 px-4 border-4 border-dashed cursor-pointer transition-all duration-100 ${
                dragActive
                  ? 'border-[#8B5CF6] bg-[#FFF9E6] -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'border-black bg-[#F9F9F6] hover:bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-[#C5BAFF] shadow-[3px_3px_0px_0px_#000] text-black mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
              </div>

              {file ? (
                <div className="text-center font-bold">
                  <p className="text-sm text-black max-w-[300px] truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center font-bold">
                  <p className="text-sm text-black uppercase tracking-wider">Drag & drop your PDF contract here</p>
                  <p className="text-xs text-zinc-650 mt-1.5 uppercase tracking-wide">or click to browse files (max 5MB)</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-4 border-2 border-black bg-[#F87171] p-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_#000]">
                {uploadError}
              </div>
            )}

            {file && (
              <div className="mt-6 flex justify-end gap-3 font-bold">
                <button
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="border-2 border-black bg-white px-5 py-3 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  Clear File
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 border-2 border-black bg-[#4ADE80] px-6 py-3 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
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
          <div className="w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#C5BAFF] shadow-[3px_3px_0px_0px_#000] text-black shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-black truncate uppercase">
                  {file?.name || 'Contract Document'}
                </h3>
                <p className="text-xs font-bold text-zinc-500 mt-1">Ready for signature authentication</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  signingStatus === 'COMPLETED'
                    ? 'bg-[#4ADE80] text-black'
                    : 'bg-[#FACC15] text-black animate-pulse'
                }`}>
                  {signingStatus}
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-black pt-6 text-black text-xs font-bold">
              <div className="space-y-1.5 bg-[#F9F9F6] border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                <span className="block font-black uppercase tracking-wider text-zinc-500 text-[10px]">Document ID</span>
                <span className="font-mono text-black select-all break-all">{result.documentId}</span>
              </div>
              <div className="space-y-1.5 bg-[#F9F9F6] border-2 border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
                <span className="block font-black uppercase tracking-wider text-zinc-500 text-[10px]">Signature ID</span>
                <span className="font-mono text-black select-all break-all">{result.signatureId}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-black">
              
              {signingStatus === 'PENDING' ? (
                <>
                  <button
                    onClick={() => setShowIframeModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-black bg-[#A78BFA] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <span>Sign in Embedded Iframe</span>
                  </button>
                  <a
                    href={result.signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-black bg-white px-5 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <span>Sign in New Tab</span>
                  </a>
                </>
              ) : (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 border-2 border-black bg-[#4ADE80] px-5 py-4 text-xs font-black uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Signed PDF</span>
                </button>
              )}

            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setSigningStatus('PENDING');
                }}
                className="text-[11px] text-zinc-650 hover:text-black font-bold uppercase underline tracking-wider transition"
              >
                Upload another contract
              </button>
            </div>

          </div>
        )}

      </div>

      {showIframeModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-none">
          <div className="relative w-full max-w-2xl h-[85vh] border-4 border-black bg-white flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-[#C5BAFF]">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-none border border-black bg-[#FACC15] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  eSign Secure Session Iframe
                </span>
              </div>
              <button
                onClick={() => setShowIframeModal(false)}
                className="border-2 border-black bg-white p-1 hover:bg-[#F87171] hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_#000]"
              >
                <svg xmlns="http://www.w3.org/205" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 bg-white relative">
              {signingStatus === 'COMPLETED' ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 text-center p-6 space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center border-4 border-black bg-[#4ADE80] text-black shadow-[4px_4px_0px_0px_#000]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-black uppercase">Verification Complete</h4>
                    <p className="text-xs font-bold text-zinc-600 mt-1">Successfully signed document. Closing iframe...</p>
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
