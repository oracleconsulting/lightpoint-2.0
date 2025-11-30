'use client';

import { PilotGate } from '@/components/PilotGate';

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PilotGate>{children}</PilotGate>;
}

