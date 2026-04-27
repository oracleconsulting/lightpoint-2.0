import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/router';
import { createContext } from '@/lib/trpc/trpc';
import { logger } from '../../../../lib/logger';

// Increase timeout for letter generation (three-stage pipeline can take 60-120s)
export const maxDuration = 300; // 5 minutes (Railway/Vercel allow up to 300s)
export const dynamic = 'force-dynamic'; // Disable static optimization

const handler = async (req: Request): Promise<Response> => {
  logger.info('🔵 tRPC request received:', req.url);

  try {
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        logger.error('❌ tRPC Error on path:', path);
        logger.error('Error details:', error);
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('❌ tRPC handler threw (unhandled):', message, err);
    return new Response(
      JSON.stringify({
        error: {
          json: {
            message,
            code: 'INTERNAL_SERVER_ERROR',
          },
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export { handler as GET, handler as POST };

