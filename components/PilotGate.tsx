'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Video, 
  Lock, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

// Calendly booking link for pilot onboarding
const CALENDLY_LINK = 'https://calendly.com/lightpoint-info/30min';

interface PilotGateProps {
  children: React.ReactNode;
}

export function PilotGate({ children }: PilotGateProps) {
  const { data: pilotStatus, isLoading } = trpc.pilot.getStatus.useQuery();
  const utils = trpc.useUtils();
  
  const scheduleMutation = trpc.pilot.scheduleCall.useMutation({
    onSuccess: () => {
      utils.pilot.getStatus.invalidate();
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-blue-200 rounded-full" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // If pilot is active or complete, show the actual content
  if (pilotStatus?.status === 'pilot_active' || pilotStatus?.status === 'pilot_complete') {
    return <>{children}</>;
  }

  // Otherwise, show the gate
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Gate Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-fit shadow-lg">
              {pilotStatus?.status === 'call_scheduled' ? (
                <CheckCircle className="h-10 w-10 text-white" />
              ) : (
                <Lock className="h-10 w-10 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {pilotStatus?.status === 'call_scheduled' 
                ? "You're All Set! 🎉" 
                : "Welcome to Your Pilot"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {pilotStatus?.status === 'call_scheduled' ? (
              // Call scheduled - waiting for activation
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 text-lg mb-2">
                    Onboarding Call Scheduled
                  </h3>
                  <p className="text-green-700">
                    Your walkthrough call has been booked. During the call, 
                    we'll activate your access and guide you through your first complaint.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">What Happens Next?</h4>
                  </div>
                  <ol className="space-y-3 text-sm text-blue-800">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
                      <span>Join the scheduled call at your booked time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">2</span>
                      <span>We'll walk through the system together</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">3</span>
                      <span>Your access will be activated during the call</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">4</span>
                      <span>You'll create your first complaint with our guidance</span>
                    </li>
                  </ol>
                </div>

                <p className="text-center text-sm text-gray-500">
                  Need to reschedule?{' '}
                  <a 
                    href={CALENDLY_LINK} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Click here to book a new time
                  </a>
                </p>
              </div>
            ) : (
              // No call scheduled yet
              <div className="space-y-6">
                <p className="text-center text-gray-600 text-lg">
                  Before you can start using Lightpoint, we need to schedule 
                  a quick <strong>30-minute walkthrough call</strong>.
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Why This Matters
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Learn the system properly from day one</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Avoid common mistakes that reduce success rates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Get your first complaint right with guided support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Ask questions and get personalised advice</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <a 
                    href={CALENDLY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Mark as scheduled when they click
                      scheduleMutation.mutate({});
                    }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-lg px-8 py-6 h-auto"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Schedule Your Walkthrough
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Takes just 30 seconds to book · Free · No commitment
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-white/60 text-sm mt-6">
          Questions? Email us at{' '}
          <a href="mailto:info@lightpoint.uk" className="text-white/80 hover:text-white underline">
            info@lightpoint.uk
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check if pilot is active
 */
export function usePilotStatus() {
  const { data, isLoading, error } = trpc.pilot.getStatus.useQuery();
  
  return {
    status: data?.status || 'pending_call',
    isActive: data?.status === 'pilot_active' || data?.status === 'pilot_complete',
    isScheduled: data?.status === 'call_scheduled',
    isPending: data?.status === 'pending_call',
    isLoading,
    error,
  };
}

