'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, CheckCircle, X, ExternalLink, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

interface OnboardingBannerProps {
  meetingBooked: boolean;
  meetingDate: string | null;
}

// Calendly booking link for pilot onboarding
const BOOKING_LINK = 'https://calendly.com/lightpoint-info/30min';

export default function OnboardingBanner({ meetingBooked, meetingDate }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const utils = trpc.useUtils();
  
  const bookMeeting = trpc.dashboard.bookOnboardingMeeting.useMutation({
    onSuccess: () => {
      utils.dashboard.getOnboardingStatus.invalidate();
    },
  });

  const completeOnboarding = trpc.dashboard.completeOnboarding.useMutation({
    onSuccess: () => {
      utils.dashboard.getOnboardingStatus.invalidate();
    },
  });

  if (dismissed) return null;

  // Meeting already booked - show confirmation
  if (meetingBooked) {
    return (
      <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Onboarding Meeting Scheduled</h3>
                <p className="text-sm text-green-700">
                  {meetingDate 
                    ? `Your walkthrough is scheduled for ${new Date(meetingDate).toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`
                    : "We'll be in touch soon to walk you through the system."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => completeOnboarding.mutate()}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Meeting not booked - show invitation
  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <CardContent className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Welcome to Lightpoint! 🎉
              </h3>
              <p className="text-gray-600 mb-4">
                Before you create your first complaint, let's schedule a quick 30-minute walkthrough. 
                I'll show you how to get the most out of the system and help you with your first case.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <a 
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Mark as booked when they click the link
                    bookMeeting.mutate({});
                  }}
                >
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Your Walkthrough
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </a>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    bookMeeting.mutate({});
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  I'll Book Later
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                💡 Tip: Most users find the walkthrough saves them hours of trial and error!
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

