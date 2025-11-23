import { TRPCProvider } from '@/lib/trpc/Provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import Navigation from '@/components/Navigation';
import CommandPalette from '@/components/CommandPalette';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Force dynamic rendering - no static generation at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Lightpoint - HMRC Complaint Management',
  description: 'Privacy-first HMRC complaint management system for accountants',
  icons: {
    icon: [
      { url: '/logo-icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/logo-icon.svg',
  },
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className} data-version="2.0.2">
        <TRPCProvider>
          <AuthProvider>
            <UserProvider>
              <Navigation />
              <CommandPalette />
              {children}
            </UserProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}