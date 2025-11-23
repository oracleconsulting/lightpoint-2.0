'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { CloudflareStreamPlayer } from '@/components/CloudflareStreamPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Users, User } from 'lucide-react';
import Link from 'next/link';

export default function WebinarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: webinar, isLoading, error } = trpc.webinars.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webinar...</p>
        </div>
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Webinar Not Found</h1>
          <p className="text-gray-600 mb-8">This webinar doesn't exist or has been removed.</p>
          <Link href="/webinars">
            <Button>View All Webinars</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLive = webinar.status === 'live';
  const isUpcoming = webinar.status === 'upcoming';
  const isCompleted = webinar.status === 'completed';
  const isCancelled = webinar.status === 'cancelled';

  // Extract video ID from stream URLs or use the video_url
  const getVideoId = () => {
    // If it's a live stream, use the live input ID from stream_url
    if (isLive && webinar.stream_url) {
      // Extract ID from RTMPS URL or use video_url
      return webinar.video_url || '63e19586ffa85461ca82c07b51709b6a';
    }
    // For recorded webinars, use video_url
    return webinar.video_url || '';
  };

  const videoId = getVideoId();
  const customerCode = 'gsyp6qxzsq50sfg1'; // Your Cloudflare customer code

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Banner */}
        {isLive && (
          <div className="mb-6 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <span className="h-4 w-4 rounded-full bg-white animate-ping"></span>
              <span className="text-xl font-bold">THIS WEBINAR IS LIVE NOW!</span>
            </div>
          </div>
        )}

        {isUpcoming && (
          <div className="mb-6 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <div className="text-center">
              <span className="text-xl font-bold">UPCOMING WEBINAR</span>
              {webinar.scheduled_date && (
                <p className="mt-2">
                  Starts: {new Date(webinar.scheduled_date).toLocaleString('en-GB', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mb-6 bg-gray-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <div className="text-center">
              <span className="text-xl font-bold">THIS WEBINAR HAS BEEN CANCELLED</span>
            </div>
          </div>
        )}

        {/* Video Player */}
        {(isLive || isCompleted) && videoId && (
          <div className="mb-8">
            <CloudflareStreamPlayer
              videoId={videoId}
              customerCode={customerCode}
              isLive={isLive}
              poster={webinar.thumbnail_url || undefined}
              controls={true}
              className="shadow-2xl"
            />
          </div>
        )}

        {/* Thumbnail for Upcoming Webinars */}
        {isUpcoming && webinar.thumbnail_url && (
          <div className="mb-8">
            <img
              src={webinar.thumbnail_url}
              alt={webinar.title}
              className="w-full aspect-video object-cover rounded-lg shadow-2xl"
            />
          </div>
        )}

        {/* Webinar Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            {webinar.title}
          </h1>

          {webinar.description && (
            <p className="text-xl text-gray-600 mb-6">
              {webinar.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-6 mb-8 text-gray-600">
            {webinar.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(webinar.scheduled_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {webinar.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{webinar.duration_minutes} minutes</span>
              </div>
            )}

            {webinar.max_attendees && webinar.max_attendees > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Max {webinar.max_attendees} attendees</span>
              </div>
            )}
          </div>

          {/* Speaker Info */}
          {webinar.speaker_name && (
            <Card className="p-6 mb-8">
              <div className="flex items-start gap-4">
                {webinar.speaker_avatar_url ? (
                  <img
                    src={webinar.speaker_avatar_url}
                    alt={webinar.speaker_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {webinar.speaker_name}
                  </h3>
                  {webinar.speaker_bio && (
                    <p className="text-gray-600">{webinar.speaker_bio}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Content */}
          {webinar.content && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: webinar.content }}
            />
          )}

          {/* CTA for Upcoming Webinars */}
          {isUpcoming && (
            <div className="mt-8 text-center">
              <Button size="lg" className="text-lg px-8">
                Register for This Webinar
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Registration opens soon. Bookmark this page!
              </p>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link href="/webinars">
            <Button variant="outline" size="lg">
              ← Back to All Webinars
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

