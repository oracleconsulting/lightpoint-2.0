import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/router';

const handler = (req: Request) => {
  console.log('🔵 tRPC request received:', req.url);
  
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error, path }) => {
      console.error('❌ tRPC Error on path:', path);
      console.error('Error details:', error);
    },
  });
};

export { handler as GET, handler as POST };

