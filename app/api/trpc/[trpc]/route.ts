import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/router';
import { createContext } from '@/lib/trpc/trpc';
import { logger } from '../../../../lib/logger';


// Increase timeout for letter generation (three-stage pipeline can take 60-120s)
export const maxDuration = 300; // 5 minutes (Railway/Vercel allow up to 300s)
export const dynamic = 'force-dynamic'; // Disable static optimization

const handler = (req: Request) => {
  logger.info('🔵 tRPC request received:', req.url);
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext, // Now includes authenticated user context
    onError: ({ error, path }) => {
      logger.error('❌ tRPC Error on path:', path);
      logger.error('Error details:', error);
    },
  });
};

export { handler as GET, handler as POST };

