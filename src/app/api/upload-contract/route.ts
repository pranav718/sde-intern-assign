import { NextRequest, NextResponse } from 'next/server';
import { saveContract, ContractMetadata } from '@/lib/db';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('document') as Blob | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No document file provided' },
        { status: 400 }
      );
    }

    const documentName = name || 'Agreement.pdf';
    
    // generate mock ids
    const documentId = `doc_${crypto.randomUUID().replace(/-/g, '')}`;
    const signatureId = `sig_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = documentName.endsWith('.pdf') ? '.pdf' : path.extname(documentName) || '.pdf';
    const fileName = `${documentId}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    // create mock signature url pointing to our local eSign simulator ui
    const origin = req.nextUrl.origin;
    const signerUrl = `${origin}/mock-gateway/${signatureId}`;

    const newContract: ContractMetadata = {
      documentId,
      signatureId,
      signerUrl,
      status: 'PENDING',
      documentName,
      filePath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // save to sqlite
    saveContract(newContract);

    // return exact fields specified by stage 2
    return NextResponse.json({
      documentId,
      signatureId,
      signatureUrl: signerUrl, // setu response signatureurl field
      status: newContract.status,
    }, { status: 201 });

  } catch (error: any) {
    console.error('error uploading contract:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
