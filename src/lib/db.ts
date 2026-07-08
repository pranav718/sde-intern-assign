import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'esign.db');

export interface ContractMetadata {
  documentId: string;
  signatureId: string;
  signerUrl: string;
  status: 'PENDING' | 'COMPLETED';
  documentName: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

// global caching for development mode hot-reloading
const globalForDb = global as unknown as { db: Database.Database };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    documentId TEXT PRIMARY KEY,
    signatureId TEXT UNIQUE NOT NULL,
    signerUrl TEXT NOT NULL,
    status TEXT NOT NULL,
    documentName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

export function getContractByDocumentId(documentId: string): ContractMetadata | null {
  const stmt = db.prepare('SELECT * FROM contracts WHERE documentId = ?');
  return (stmt.get(documentId) as ContractMetadata) || null;
}

export function getContractBySignatureId(signatureId: string): ContractMetadata | null {
  const stmt = db.prepare('SELECT * FROM contracts WHERE signatureId = ?');
  return (stmt.get(signatureId) as ContractMetadata) || null;
}

export function getAllContracts(): ContractMetadata[] {
  const stmt = db.prepare('SELECT * FROM contracts ORDER BY createdAt DESC');
  return stmt.all() as ContractMetadata[];
}

export function saveContract(contract: ContractMetadata) {
  const stmt = db.prepare(`
    INSERT INTO contracts (documentId, signatureId, signerUrl, status, documentName, filePath, createdAt, updatedAt)
    VALUES (@documentId, @signatureId, @signerUrl, @status, @documentName, @filePath, @createdAt, @updatedAt)
    ON CONFLICT(documentId) DO UPDATE SET
      status = excluded.status,
      updatedAt = excluded.updatedAt
  `);
  stmt.run(contract);
}

export function updateContractStatus(signatureId: string, status: 'PENDING' | 'COMPLETED') {
  const stmt = db.prepare(`
    UPDATE contracts 
    SET status = ?, updatedAt = ? 
    WHERE signatureId = ?
  `);
  stmt.run(status, new Date().toISOString(), signatureId);
}
