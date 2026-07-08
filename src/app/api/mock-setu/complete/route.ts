import { NextRequest, NextResponse } from 'next/server';
import { updateContractStatus, getContractBySignatureId } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { signatureId } = await req.json();

    if (!signatureId) {
      return NextResponse.json(
        { error: 'No signatureId provided' },
        { status: 400 }
      );
    }

    const contract = getContractBySignatureId(signatureId);
    if (!contract) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 }
      );
    }

    // update status to COMPLETED
    updateContractStatus(signatureId, 'COMPLETED');

    return NextResponse.json({
      success: true,
      message: 'Signature simulated successfully as sign_complete',
      status: 'COMPLETED',
    });

  } catch (error: any) {
    console.error('Error completing mock signature:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
