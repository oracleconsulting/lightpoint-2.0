'use client';

import Link from 'next/link';
import { format, isBefore, parseISO } from 'date-fns';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/cases/TierBadge';

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { data: workspace } = trpc.case.get.useQuery(params.id);
  const caseRecord = workspace?.case;
  const nextDeadline = (workspace?.events || [])
    .filter((event: any) => event.deadline_status === 'live')
    .sort((a: any, b: any) => String(a.event_date).localeCompare(String(b.event_date)))[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cases" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cases
          </Link>
          {caseRecord && (
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{caseRecord.title}</h1>
                  <TierBadge tier={caseRecord.tier} />
                  <Badge variant={caseRecord.status === 'closed' ? 'secondary' : 'default'}>
                    {String(caseRecord.status).replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {caseRecord.case_reference}
                  {caseRecord.client_name ? ` · ${caseRecord.client_name}` : ''}
                  {caseRecord.hmrc_department ? ` · ${caseRecord.hmrc_department}` : ''}
                </p>
              </div>
              {nextDeadline && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    isBefore(parseISO(nextDeadline.event_date), new Date())
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Next deadline
                  </div>
                  <p className="mt-1">
                    {nextDeadline.title} · {format(parseISO(nextDeadline.event_date), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
