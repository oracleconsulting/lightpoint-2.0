import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { processDocument } from '@/lib/documentProcessor';
import { logger } from '../../../../lib/logger';


export async function POST(request: NextRequest) {
  try {
    logger.info('📥 Document upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const complaintId = formData.get('complaintId') as string;
    const documentType = formData.get('documentType') as string || 'evidence';

    logger.info(`📄 File: ${file?.name}, Size: ${file?.size}, Complaint: ${complaintId}`);

    if (!file || !complaintId) {
      logger.error('❌ Missing required fields:', { file: !!file, complaintId: !!complaintId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    logger.info('🔄 Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    logger.info(`✅ Buffer created: ${buffer.length} bytes`);

    // Upload to Supabase Storage
    const fileName = `${complaintId}/${documentType}/${Date.now()}_${file.name}`;
    logger.info(`📤 Uploading to Supabase: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await (supabaseAdmin as any).storage
      .from('complaint-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      logger.error('❌ Supabase upload error:', JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    logger.info(`✅ File uploaded successfully: ${(uploadData as any).path}`);

    // Process document
    logger.info('🔄 Processing document (extracting text, generating embeddings)...');
    const document = await processDocument(
      buffer,
      complaintId,
      documentType as any,
      (uploadData as any).path
    );

    logger.info(`✅ Document processed: ${document.id}`);
    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    logger.error('❌ Document upload error:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

