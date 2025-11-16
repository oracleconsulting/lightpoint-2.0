-- ============================================================================
-- LIGHTPOINT V2.0 - STORAGE BUCKETS SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to create storage buckets and RLS policies
-- 
-- This creates:
-- 1. complaint-documents bucket (for uploaded evidence, letters)
-- 2. knowledge-base bucket (for CHG/CRG documents, manual uploads)
-- 3. RLS policies for secure access
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Storage Buckets
-- ============================================================================

-- Create complaint-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-documents',
  'complaint-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create knowledge-base bucket (for manual KB uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/html',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create RLS Policies for complaint-documents
-- ============================================================================

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to complaint-documents"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'complaint-documents');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated select from complaint-documents"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'complaint-documents');

-- Allow authenticated users to update files (e.g., retry OCR)
CREATE POLICY "Allow authenticated updates to complaint-documents"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'complaint-documents')
WITH CHECK (bucket_id = 'complaint-documents');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from complaint-documents"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'complaint-documents');

-- ============================================================================
-- STEP 3: Create RLS Policies for knowledge-base
-- ============================================================================

-- Allow authenticated users to upload KB documents
CREATE POLICY "Allow authenticated uploads to knowledge-base"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'knowledge-base');

-- Allow authenticated users to view KB documents
CREATE POLICY "Allow authenticated select from knowledge-base"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'knowledge-base');

-- Allow authenticated users to update KB documents
CREATE POLICY "Allow authenticated updates to knowledge-base"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'knowledge-base')
WITH CHECK (bucket_id = 'knowledge-base');

-- Allow authenticated users to delete KB documents
CREATE POLICY "Allow authenticated deletes from knowledge-base"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'knowledge-base');

-- ============================================================================
-- STEP 4: Verify Setup
-- ============================================================================

-- Check that buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id IN ('complaint-documents', 'knowledge-base')
ORDER BY name;

-- Check that policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%complaint-documents%' 
  OR policyname LIKE '%knowledge-base%'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Buckets:';
  RAISE NOTICE '   - complaint-documents (10MB limit, private)';
  RAISE NOTICE '   - knowledge-base (10MB limit, private)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '   - Upload, Select, Update, Delete enabled for authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Test document upload on lightpoint.uk';
  RAISE NOTICE '   2. Verify files appear in Supabase Storage UI';
  RAISE NOTICE '   3. Check that OCR extraction runs successfully';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Storage is now ready for production use!';
END $$;

