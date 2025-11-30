'use client';

import { PilotGate } from '@/components/PilotGate';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PilotGate>{children}</PilotGate>;
}

