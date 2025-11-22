'use client';

import React from 'react';
import InteractiveTimeline from '@/components/timeline/InteractiveTimeline';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TimelineDemoPage() {
  // Mock timeline data
  const mockEvents = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      title: 'Initial Complaint Filed',
      description: 'Complaint submitted regarding incorrect tax calculation',
      type: 'outbound' as const,
      department: 'HMRC Self Assessment',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Initial_Complaint.pdf',
    },
    {
      id: '2',
      date: new Date('2024-01-22'),
      title: 'HMRC Acknowledgement',
      description: 'HMRC confirmed receipt and assigned reference',
      type: 'inbound' as const,
      department: 'HMRC Complaints Team',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Acknowledgement_Letter.pdf',
    },
    {
      id: '3',
      date: new Date('2024-02-05'),
      title: 'Evidence Submitted',
      description: 'Supporting documents and calculations provided',
      type: 'outbound' as const,
      department: 'HMRC Self Assessment',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Supporting_Evidence.pdf',
    },
    {
      id: '4',
      date: new Date('2024-02-20'),
      title: 'Case Review Meeting',
      description: 'Internal HMRC review of submitted evidence',
      type: 'milestone' as const,
      department: 'HMRC Disputes Resolution',
      status: 'completed' as const,
    },
    {
      id: '5',
      date: new Date('2024-03-01'),
      title: 'Escalation to Tier 2',
      description: 'Case escalated due to complexity',
      type: 'escalation' as const,
      department: 'HMRC Senior Complaints Team',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Escalation_Notice.pdf',
    },
    {
      id: '6',
      date: new Date('2024-03-15'),
      title: 'Resolution Proposal',
      description: 'HMRC proposed settlement terms',
      type: 'inbound' as const,
      department: 'HMRC Settlements',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Settlement_Offer.pdf',
    },
    {
      id: '7',
      date: new Date('2024-03-22'),
      title: 'Client Acceptance',
      description: 'Client agreed to settlement terms',
      type: 'milestone' as const,
      department: 'Internal',
      status: 'completed' as const,
    },
    {
      id: '8',
      date: new Date('2024-03-30'),
      title: 'Final Resolution',
      description: '£15,240 refund approved and processed',
      type: 'milestone' as const,
      department: 'HMRC Payments',
      status: 'completed' as const,
      documentUrl: '#',
      documentName: 'Final_Resolution.pdf',
    },
  ];

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-blurple transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Complaint Timeline Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Interactive visualization of complaint progression
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-card p-4">
          <h2 className="font-semibold text-blue-900 mb-2">Interactive Features:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on any timeline event to view details</li>
            <li>• Use zoom controls to adjust view (60% - 200%)</li>
            <li>• Scroll horizontally with arrows or mouse/trackpad</li>
            <li>• Hover over events for visual feedback</li>
            <li>• Export timeline to PDF (coming soon)</li>
          </ul>
        </div>

        <InteractiveTimeline
          events={mockEvents}
          onEventClick={handleEventClick}
          onExportPDF={handleExportPDF}
        />

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-card border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Duration</div>
            <div className="text-2xl font-bold text-gray-900">74 days</div>
            <div className="text-xs text-success mt-1">✓ 47 days faster than average</div>
          </div>

          <div className="bg-white rounded-card border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-xs text-gray-500 mt-1">4 inbound, 4 outbound</div>
          </div>

          <div className="bg-white rounded-card border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Escalations</div>
            <div className="text-2xl font-bold text-gray-900">1</div>
            <div className="text-xs text-gray-500 mt-1">To Tier 2 on Day 45</div>
          </div>

          <div className="bg-white rounded-card border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Outcome</div>
            <div className="text-2xl font-bold text-success">£15,240</div>
            <div className="text-xs text-gray-500 mt-1">Refund approved</div>
          </div>
        </div>
      </div>
    </div>
  );
}

