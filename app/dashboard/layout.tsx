'use client';

import { PilotGate } from '@/components/PilotGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PilotGate>{children}</PilotGate>;
}

