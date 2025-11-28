/**
 * Streaming Letter Generation API
 * 
 * Uses Server-Sent Events (SSE) to provide real-time progress updates
 * during the three-stage letter generation pipeline.
 * 
 * Events:
 * - progress: { stage: string, percent: number, message: string }
 * - complete: { letter: string }
 * - error: { message: string }
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateComplaintLetterThreeStage } from '@/lib/openrouter/three-stage-client';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to create SSE response
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      logger.info('SSE stream cancelled by client');
    },
  });
  
  const send = (event: string, data: any) => {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    } catch (e) {
      logger.error('Error sending SSE message:', e);
    }
  };
  
  const close = () => {
    try {
      controller.close();
    } catch (e) {
      // Stream already closed
    }
  };
  
  return { stream, send, close };
}

export async function POST(request: NextRequest) {
  const { stream, send, close } = createSSEStream();
  
  // Start processing in background
  (async () => {
    try {
      // Auth check
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        send('error', { message: 'Unauthorized' });
        close();
        return;
      }
      
      // Parse request body
      const body = await request.json();
      const {
        complaintAnalysis,
        clientReference,
        hmrcDepartment,
        practiceLetterhead,
        chargeOutRate,
        userName,
        userTitle,
        userEmail,
        userPhone,
        additionalContext,
      } = body;
      
      if (!complaintAnalysis || !clientReference) {
        send('error', { message: 'Missing required fields: complaintAnalysis, clientReference' });
        close();
        return;
      }
      
      // Progress callback
      const onProgress = (stage: string, percent: number, message: string) => {
        send('progress', { stage, percent, message });
      };
      
      // Send initial progress
      send('progress', { stage: 'starting', percent: 0, message: 'Initializing letter generation...' });
      
      // Generate letter with progress updates
      const letter = await generateComplaintLetterThreeStage(
        complaintAnalysis,
        clientReference,
        hmrcDepartment,
        practiceLetterhead,
        chargeOutRate,
        userName,
        userTitle,
        userEmail,
        userPhone,
        additionalContext,
        onProgress
      );
      
      // Send completion
      send('complete', { letter });
      
    } catch (error: any) {
      logger.error('Letter generation stream error:', error);
      send('error', { message: error.message || 'Letter generation failed' });
    } finally {
      close();
    }
  })();
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

