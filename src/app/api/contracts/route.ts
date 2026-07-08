import { NextRequest, NextResponse } from 'next/server';
import { getAllContracts } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const contracts = getAllContracts();
    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Error fetching all contracts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
