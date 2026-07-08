import { NextRequest, NextResponse } from 'next/server';
import { saveContract, ContractMetadata } from '@/lib/db';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, redirectUrl, signers } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const finalRedirect = redirectUrl || 'https://google.com';
    
    // generate signatureRequestId
    const signatureId = `sig_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // build the mock eSign gateway URL
    const origin = req.nextUrl.origin;
    const signerUrl = `${origin}/mock-gateway/${signatureId}?redirect_to=${encodeURIComponent(finalRedirect)}`;

    // build contract metadata record
    const documentName = 'Agreement.pdf';
    const filePath = path.join(process.cwd(), 'uploads', `${documentId}.pdf`);

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

    // save metadata in sqlite
    saveContract(newContract);

    // standard setu create signature response structure
    return NextResponse.json({
      id: signatureId,
      documentId,
      status: 'PENDING',
      redirectUrl: finalRedirect,
      signers: [
        {
          signerId: 'signer_1',
          status: 'pending',
          url: signerUrl,
        }
      ]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in Setu mock signature request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
