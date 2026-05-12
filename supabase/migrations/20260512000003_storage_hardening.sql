-- Storage Hardening: Setting up buckets and strict security policies

-- 1. Resumes Bucket (For Job Applications)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Applicants can upload resumes (but not read/list)
CREATE POLICY "Applicants can upload resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

-- Policy: Only Admins can view/download resumes
CREATE POLICY "Admins can view resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
);

-- Policy: Only Admins can delete resumes
CREATE POLICY "Admins can delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
);


-- 2. Product Images Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy: Farmers can upload their own product images
CREATE POLICY "Farmers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Farmers can update/delete their own product images
CREATE POLICY "Farmers can manage own product images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. Avatars Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Users can manage their own avatar
CREATE POLICY "Users can manage own avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
