import { NextRequest, NextResponse } from 'next/server';
import { getContractBySignatureId, getContractByDocumentId } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // check if it is a signature id or document id
    let contract = getContractBySignatureId(id);
    if (!contract) {
      contract = getContractByDocumentId(id);
    }

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract or signature request not found' },
        { status: 404 }
      );
    }

    // setu-like response format
    return NextResponse.json({
      id: contract.signatureId,
      documentId: contract.documentId,
      status: contract.status, // PENDING or COMPLETED
      signers: [
        {
          signerId: 'signer_1',
          status: contract.status === 'COMPLETED' ? 'sign_complete' : 'pending',
          url: contract.signerUrl,
        }
      ],
      updatedAt: contract.updatedAt,
    });

  } catch (error: any) {
    console.error('Error fetching signature status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
