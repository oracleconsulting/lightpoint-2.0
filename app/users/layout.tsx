'use client';

import { PilotGate } from '@/components/PilotGate';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PilotGate>{children}</PilotGate>;
}

