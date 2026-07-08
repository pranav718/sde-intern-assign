import { NextRequest, NextResponse } from 'next/server';
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
    
    // generate mock documentId
    const documentId = `doc_${crypto.randomUUID().replace(/-/g, '')}`;
    
    // save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = documentName.endsWith('.pdf') ? '.pdf' : path.extname(documentName) || '.pdf';
    const fileName = `${documentId}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    // standard setu upload document response fields
    return NextResponse.json({
      id: documentId,
      name: documentName,
      createdAt: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in Setu mock document upload:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
