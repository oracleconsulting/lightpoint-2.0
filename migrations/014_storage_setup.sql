-- ============================================
-- LIGHTPOINT V2.0 - SUPABASE STORAGE SETUP
-- Migration: Create storage buckets and policies
-- Date: 2024-11-22
-- ============================================

-- Note: This SQL is for reference. Storage buckets must be created via Supabase Dashboard.
-- After creating buckets, run the policies below.

-- =====================================
-- STORAGE BUCKETS TO CREATE VIA DASHBOARD
-- =====================================

-- 1. blog-images (public)
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/*

-- 2. cpd-media (public)
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/*, application/pdf

-- 3. webinar-videos (public)
--    - Public: Yes
--    - File size limit: 500MB
--    - Allowed MIME types: video/*

-- 4. documents (authenticated)
--    - Public: No
--    - File size limit: 20MB
--    - Allowed MIME types: application/pdf, application/msword, etc.

-- =====================================
-- STORAGE POLICIES
-- =====================================

-- Blog Images: Admins can upload, everyone can view
CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- CPD Media: Admins can upload, everyone can view
CREATE POLICY "Admins can upload cpd media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cpd-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Anyone can view cpd media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cpd-media');

CREATE POLICY "Admins can update cpd media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cpd-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete cpd media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cpd-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Webinar Videos: Admins can upload, everyone can view
CREATE POLICY "Admins can upload webinar videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'webinar-videos' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Anyone can view webinar videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'webinar-videos');

CREATE POLICY "Admins can update webinar videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'webinar-videos' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete webinar videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'webinar-videos' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Documents: Admins can manage, authenticated users can view their own
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Done!
SELECT 'Storage policies created successfully! Remember to create buckets via Dashboard first.' as status;

