import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Shared tRPC CRUD helpers to reduce code duplication across content routers
 * (blog, cpd, webinars, examples)
 */

interface ContentItem {
  id?: string;
  title: string;
  slug: string;
  content?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  [key: string]: any; // Allow additional fields
}

/**
 * Create a Supabase client for use in tRPC procedures
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Generic list query for content tables
 */
export async function listContent<T = ContentItem>(
  tableName: string,
  filters?: {
    searchQuery?: string;
    category?: string;
    status?: 'draft' | 'published';
    limit?: number;
    offset?: number;
  }
) {
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('is_published', filters.status === 'published');
  }

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error(`Error listing ${tableName}:`, error);
    throw new Error(error.message);
  }

  return { items: data as T[], total: count || 0 };
}

/**
 * Generic get by ID query
 */
export async function getContentById<T = ContentItem>(
  tableName: string,
  id: string
) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} by ID:`, error);
    throw new Error(`${tableName} not found`);
  }

  return data as T;
}

/**
 * Generic get by slug query (public)
 */
export async function getContentBySlug<T = ContentItem>(
  tableName: string,
  slug: string
) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} by slug:`, error);
    throw new Error(`${tableName} not found`);
  }

  return data as T;
}

/**
 * Generic create mutation
 */
export async function createContent<T = ContentItem>(
  tableName: string,
  data: Partial<T>
) {
  const supabase = createSupabaseClient();

  const { data: newItem, error } = await supabase
    .from(tableName)
    .insert({
      ...data,
      status: (data as any).is_published ? 'published' : 'draft',
    } as any)
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw new Error(error.message);
  }

  return newItem as T;
}

/**
 * Generic update mutation
 */
export async function updateContent<T = ContentItem>(
  tableName: string,
  id: string,
  data: Partial<T>
) {
  const supabase = createSupabaseClient();

  const { data: updatedItem, error } = await supabase
    .from(tableName)
    .update({
      ...data,
      status: (data as any).is_published ? 'published' : 'draft',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw new Error(error.message);
  }

  return updatedItem as T;
}

/**
 * Generic delete mutation
 */
export async function deleteContent(tableName: string, id: string) {
  const supabase = createSupabaseClient();

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting ${tableName}:`, error);
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Increment view count
 */
export async function incrementViewCount(tableName: string, id: string) {
  const supabase = createSupabaseClient();

  const { error } = await supabase.rpc('increment_view_count', {
    table_name: tableName,
    content_id: id,
  });

  if (error) {
    console.warn(`Failed to increment view count for ${tableName}:`, error);
    // Don't throw - view counting is non-critical
  }

  return { success: !error };
}

/**
 * Common validation schemas
 */
export const baseContentSchema = {
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  content: z.any(), // TipTap JSON content
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
};

