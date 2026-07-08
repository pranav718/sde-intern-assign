'use client';

import React, { useState, useEffect } from 'react';

interface ContractItem {
  documentId: string;
  signatureId: string;
  signerUrl: string;
  status: 'PENDING' | 'COMPLETED';
  documentName: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export default function StatusPage() {
  const [searchId, setSearchId] = useState('');
  const [searchedContract, setSearchedContract] = useState<ContractItem | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // fetch all contracts from database
  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchedContract(null);

    try {
      const res = await fetch(`/api/signature-status/${searchId.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No contract found for this ID');
      }

      // convert setu response structure back to our local item layout for UI display
      const mappedContract: ContractItem = {
        documentId: data.documentId,
        signatureId: data.id,
        signerUrl: data.signers[0].url,
        status: (data.status === 'sign_complete' || data.status === 'COMPLETED') ? 'COMPLETED' : 'PENDING',
        documentName: 'Agreement.pdf', // default fallback
        filePath: '',
        createdAt: data.updatedAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      // try to find the documentName from our local loaded list to show a nice name
      const localMatch = contracts.find(c => c.signatureId === mappedContract.signatureId || c.documentId === mappedContract.documentId);
      if (localMatch) {
        mappedContract.documentName = localMatch.documentName;
        mappedContract.createdAt = localMatch.createdAt;
      }

      setSearchedContract(mappedContract);
    } catch (err: any) {
      setSearchError(err.message || 'Verification search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  // poll status checker
  const handleCheckStatus = async (signatureId: string) => {
    try {
      const res = await fetch(`/api/signature-status/${signatureId}`);
      const data = await res.json();
      
      // refresh local list
      fetchContracts();

      // update searched item if it is the one being viewed
      if (searchedContract && (searchedContract.signatureId === signatureId || searchedContract.documentId === signatureId)) {
        setSearchedContract(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: (data.status === 'sign_complete' || data.status === 'COMPLETED') ? 'COMPLETED' : 'PENDING',
            updatedAt: data.updatedAt
          };
        });
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 px-6 py-12 text-zinc-50 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[110px]" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="text-lg font-bold text-zinc-100">Check Document Status</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Enter a Signature ID or Document ID to fetch the real-time status from Setu APIs.
            </p>

            <form onSubmit={handleSearch} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter ID (sig_... or doc_...)"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs tracking-wider text-zinc-100 placeholder-zinc-700 outline-none transition duration-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  required
                />
              </div>

              {searchError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={searchLoading}
                className="w-full flex items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 transition duration-200 disabled:opacity-50"
              >
                {searchLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Query API Status'
                )}
              </button>
            </form>
          </div>

          {searchedContract && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl relative animate-fade-in">
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />

              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-zinc-100 truncate max-w-[150px]">
                  {searchedContract.documentName}
                </h3>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  searchedContract.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                }`}>
                  {searchedContract.status}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Document ID:</span>
                  <span className="font-mono text-zinc-300 select-all">{searchedContract.documentId.slice(0, 15)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Signature ID:</span>
                  <span className="font-mono text-zinc-300 select-all">{searchedContract.signatureId.slice(0, 15)}...</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                {searchedContract.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleCheckStatus(searchedContract.signatureId)}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                    >
                      Sync Status
                    </button>
                    <a
                      href={searchedContract.signerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition"
                    >
                      Sign Doc
                    </a>
                  </>
                ) : (
                  <a
                    href={`/api/download/${searchedContract.documentId}`}
                    className="w-full text-center flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Download Signed PDF</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">All Database Records</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Persistent log of contract upload instances in the local SQLite database.
              </p>
            </div>
            <button
              onClick={fetchContracts}
              className="rounded-lg p-1.5 border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-900 transition hover:text-zinc-200"
              title="Refresh database records"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {listLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-xs text-zinc-500 mt-3">Connecting SQLite records...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-850 rounded-xl bg-zinc-950/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-zinc-600 border border-zinc-800 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-400">No database records found</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-[200px]">Go to the Upload page to set up your first document eSign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                    <th className="py-3 px-2">Document Name</th>
                    <th className="py-3 px-2">Created At</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {contracts.map((item) => (
                    <tr key={item.documentId} className="hover:bg-zinc-900/30 transition">
                      <td className="py-3.5 px-2">
                        <div className="font-semibold text-zinc-200 max-w-[160px] truncate" title={item.documentName}>
                          {item.documentName}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          ID: {item.signatureId.slice(0, 12)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-zinc-400">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1.5">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleCheckStatus(item.signatureId)}
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-800 transition"
                              title="Check status updates"
                            >
                              Sync
                            </button>
                            <a
                              href={item.signerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-2.5 py-1.5 rounded-lg bg-violet-600 text-white font-semibold shadow-md hover:bg-violet-500 transition"
                            >
                              Sign
                            </a>
                          </>
                        ) : (
                          <a
                            href={`/api/download/${item.documentId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
