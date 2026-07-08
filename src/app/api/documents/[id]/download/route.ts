import { NextRequest, NextResponse } from 'next/server';
import { getContractByDocumentId } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = getContractByDocumentId(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (contract.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Forbidden: Document has not been signed yet' },
        { status: 403 }
      );
    }

    const filePath = contract.filePath;
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Document file not found on disk' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${contract.documentName}"`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
