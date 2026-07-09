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
    <div className="flex-1 flex flex-col px-6 py-12 text-black relative">
      
      <div className="relative w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
            <h2 className="text-lg font-black uppercase text-black">Check Status</h2>
            <p className="text-xs font-bold text-zinc-600 mt-1">
              Enter a Signature ID or Document ID to fetch the real-time status from Setu APIs.
            </p>

            <form onSubmit={handleSearch} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter ID (sig_... or doc_...)"
                  className="w-full border-2 border-black bg-white px-4 py-3 text-xs tracking-wider text-black placeholder-zinc-400 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>

              {searchError && (
                <div className="border-2 border-black bg-[#F87171] p-3 text-xs font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={searchLoading}
                className="w-full flex items-center justify-center border-2 border-black bg-[#A78BFA] px-4 py-3 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
              >
                {searchLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  'Query API Status'
                )}
              </button>
            </form>
          </div>

          {searchedContract && (
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] relative">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-black uppercase text-black truncate max-w-[150px]">
                  {searchedContract.documentName}
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  searchedContract.status === 'COMPLETED'
                    ? 'bg-[#4ADE80] text-black'
                    : 'bg-[#FACC15] text-black animate-pulse'
                }`}>
                  {searchedContract.status}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-[11px] font-bold text-zinc-700 border-t-2 border-black pt-4">
                <div className="flex justify-between bg-[#F9F9F6] border border-black p-2">
                  <span className="text-zinc-500">Doc ID:</span>
                  <span className="font-mono text-black select-all">{searchedContract.documentId.slice(0, 15)}...</span>
                </div>
                <div className="flex justify-between bg-[#F9F9F6] border border-black p-2">
                  <span className="text-zinc-500">Sig ID:</span>
                  <span className="font-mono text-black select-all">{searchedContract.signatureId.slice(0, 15)}...</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2 font-bold">
                {searchedContract.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleCheckStatus(searchedContract.signatureId)}
                      className="flex-1 border-2 border-black bg-white px-3 py-2.5 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Sync
                    </button>
                    <a
                      href={searchedContract.signerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center border-2 border-black bg-[#A78BFA] px-3 py-2.5 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Sign
                    </a>
                  </>
                ) : (
                  <a
                    href={`/api/download/${searchedContract.documentId}`}
                    className="w-full text-center flex items-center justify-center gap-1.5 border-2 border-black bg-[#4ADE80] px-3 py-2.5 text-xs uppercase tracking-wider text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Download Signed PDF</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
            <div>
              <h2 className="text-lg font-black uppercase text-black">All Database Records</h2>
              <p className="text-xs font-bold text-zinc-650 mt-1">
                Persistent log of contract upload instances in the local SQLite database.
              </p>
            </div>
            <button
              onClick={fetchContracts}
              className="border-2 border-black bg-white p-2 hover:bg-[#FFF455] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all text-black"
              title="Refresh database records"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {listLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <p className="text-xs font-bold text-zinc-600 mt-3">Connecting SQLite records...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-black bg-[#F9F9F6]">
              <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-[#C5BAFF] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
                </svg>
              </div>
              <p className="text-sm font-black uppercase text-black">No database records found</p>
              <p className="text-xs font-bold text-zinc-600 mt-2 max-w-[240px]">Go to the Upload page to set up your first document eSign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-left text-xs font-bold">
                <thead>
                  <tr className="border-b-2 border-black bg-[#FFF5E0] text-black font-black uppercase">
                    <th className="py-3 px-3 border-r-2 border-black">Document Name</th>
                    <th className="py-3 px-3 border-r-2 border-black">Created At</th>
                    <th className="py-3 px-3 border-r-2 border-black">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white">
                  {contracts.map((item) => (
                    <tr key={item.documentId} className="hover:bg-[#FFF9E6] transition-colors">
                      <td className="py-3.5 px-3 border-r-2 border-black">
                        <div className="font-black text-black max-w-[160px] truncate" title={item.documentName}>
                          {item.documentName}
                        </div>
                        <div className="text-[10px] text-zinc-550 font-mono mt-0.5">
                          ID: {item.signatureId.slice(0, 12)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-3 border-r-2 border-black text-zinc-750">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-3 border-r-2 border-black">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          item.status === 'COMPLETED'
                            ? 'bg-[#4ADE80] text-black'
                            : 'bg-[#FACC15] text-black animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2 font-bold">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleCheckStatus(item.signatureId)}
                              className="px-2.5 py-1.5 border-2 border-black bg-white text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all"
                              title="Check status updates"
                            >
                              Sync
                            </button>
                            <a
                              href={item.signerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-2.5 py-1.5 border-2 border-black bg-[#A78BFA] text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all"
                            >
                              Sign
                            </a>
                          </>
                        ) : (
                          <a
                            href={`/api/download/${item.documentId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-black bg-[#4ADE80] text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>Download</span>
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
