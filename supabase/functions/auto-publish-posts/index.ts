import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Edge Function: Auto-Publish Scheduled Blog Posts
 * 
 * Triggered by: Supabase Cron (every 5 minutes)
 * Purpose: Automatically publish blog posts when their scheduled_for time arrives
 * 
 * Setup:
 * 1. Deploy this function: supabase functions deploy auto-publish-posts
 * 2. Create cron job in Supabase Dashboard:
 *    - Cron Schedule: star-slash-5-star-star-star-star (every 5 minutes)
 *    - Function: auto-publish-posts
 */

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  scheduled_for: string;
}

serve(async (req) => {
  try {
    // Verify this is a cron request (optional security check)
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
      .rpc('get_posts_ready_to_publish');

    if (fetchError) {
      throw new Error(`Failed to fetch posts: ${fetchError.message}`);
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      console.log('No posts ready to publish');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts to publish',
          published: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${postsToPublish.length} posts ready to publish`);

    // Publish the posts
    const { data: publishedPosts, error: publishError } = await supabase
      .rpc('auto_publish_scheduled_posts');

    if (publishError) {
      throw new Error(`Failed to publish posts: ${publishError.message}`);
    }

    // Log success
    console.log('Successfully published posts:', publishedPosts);

    // Optional: Trigger webhooks, send notifications, etc.
    // For each published post, you could:
    // - Send email notification to subscribers
    // - Post to social media (via your AI social engine)
    // - Ping search engines for indexing
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${publishedPosts?.length || 0} posts`,
        published: publishedPosts?.length || 0,
        posts: publishedPosts
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-publish-posts:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

