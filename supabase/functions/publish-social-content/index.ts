import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * Edge Function: Auto-Publish Social Content
 * 
 * Triggered by: Supabase Cron (every 5 minutes)
 * Purpose: Automatically publish scheduled social media posts
 * 
 * Supports:
 * - Buffer API (recommended - easiest)
 * - Direct Twitter API
 * - Direct LinkedIn API
 * - Direct Facebook API
 * 
 * Setup Instructions in: SOCIAL_API_SETUP.md
 */

interface SocialPost {
  id: string;
  blog_post_id: string;
  platform: 'twitter' | 'linkedin' | 'facebook';
  content: string;
  hashtags?: string[];
  scheduled_for: string;
}

// =====================================================
// BUFFER API INTEGRATION (Recommended)
// =====================================================

async function publishViaBuffer(post: SocialPost): Promise<any> {
  const BUFFER_ACCESS_TOKEN = Deno.env.get('BUFFER_ACCESS_TOKEN');
  const BUFFER_PROFILE_IDS = JSON.parse(Deno.env.get('BUFFER_PROFILE_IDS') || '{}');

  if (!BUFFER_ACCESS_TOKEN) {
    throw new Error('BUFFER_ACCESS_TOKEN not configured');
  }

  const profileId = BUFFER_PROFILE_IDS[post.platform];
  if (!profileId) {
    throw new Error(`No Buffer profile ID configured for ${post.platform}`);
  }

  const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      profile_ids: [profileId],
      text: post.content,
      now: true, // Publish immediately
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Buffer API error: ${error}`);
  }

  return await response.json();
}

// =====================================================
// DIRECT TWITTER API (v2)
// =====================================================

async function publishToTwitter(post: SocialPost): Promise<any> {
  const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN');

  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('TWITTER_BEARER_TOKEN not configured');
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: post.content,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter API error: ${error}`);
  }

  return await response.json();
}

// =====================================================
// DIRECT LINKEDIN API
// =====================================================

async function publishToLinkedIn(post: SocialPost): Promise<any> {
  const LINKEDIN_ACCESS_TOKEN = Deno.env.get('LINKEDIN_ACCESS_TOKEN');
  const LINKEDIN_PERSON_URN = Deno.env.get('LINKEDIN_PERSON_URN');

  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_URN) {
    throw new Error('LinkedIn credentials not configured');
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: LINKEDIN_PERSON_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${error}`);
  }

  return await response.json();
}

// =====================================================
// DIRECT FACEBOOK API
// =====================================================

async function publishToFacebook(post: SocialPost): Promise<any> {
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID');

  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    throw new Error('Facebook credentials not configured');
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: post.content,
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook API error: ${error}`);
  }

  return await response.json();
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get posts ready to publish
    const { data: postsToPublish, error: fetchError } = await supabase
      .rpc('get_social_posts_ready_to_publish');

    if (fetchError) {
      throw new Error(`Failed to fetch posts: ${fetchError.message}`);
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      console.log('No posts ready to publish');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts to publish',
          published: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${postsToPublish.length} posts ready to publish`);

    // Publish each post
    const results = [];
    const USE_BUFFER = Deno.env.get('USE_BUFFER') === 'true';

    for (const post of postsToPublish) {
      try {
        let platformResponse;

        if (USE_BUFFER) {
          // Use Buffer (recommended)
          platformResponse = await publishViaBuffer(post);
        } else {
          // Use direct APIs
          if (post.platform === 'twitter') {
            platformResponse = await publishToTwitter(post);
          } else if (post.platform === 'linkedin') {
            platformResponse = await publishToLinkedIn(post);
          } else if (post.platform === 'facebook') {
            platformResponse = await publishToFacebook(post);
          }
        }

        // Update database
        await supabase
          .from('social_content_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            platform_post_id: platformResponse.id || platformResponse.data?.id,
            platform_url: platformResponse.url || null,
            platform_response: platformResponse,
          })
          .eq('id', post.id);

        results.push({
          success: true,
          id: post.id,
          platform: post.platform,
        });

        console.log(`✅ Published ${post.platform} post: ${post.id}`);

      } catch (error: any) {
        console.error(`❌ Failed to publish ${post.platform} post ${post.id}:`, error);

        // Mark as failed
        await supabase
          .from('social_content_posts')
          .update({
            status: 'failed',
            platform_response: { error: error.message },
          })
          .eq('id', post.id);

        results.push({
          success: false,
          id: post.id,
          platform: post.platform,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${successCount} of ${postsToPublish.length} posts`,
        total: postsToPublish.length,
        successful: successCount,
        failed: postsToPublish.length - successCount,
        details: results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in publish-social-content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

