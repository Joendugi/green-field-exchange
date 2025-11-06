-- Add username to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for username searches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create index for full_name searches
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Create index for posts content searches
CREATE INDEX IF NOT EXISTS idx_posts_content ON public.posts USING gin(to_tsvector('english', content));

-- Drop the old foreign key constraint first
ALTER TABLE public.verification_requests 
  DROP CONSTRAINT IF EXISTS verification_requests_farmer_id_fkey;

-- Rename the column
ALTER TABLE public.verification_requests 
  RENAME COLUMN farmer_id TO user_id;

-- Add the new foreign key
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for verification_requests
DROP POLICY IF EXISTS "Farmers can create verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Farmers can view own verification requests" ON public.verification_requests;

CREATE POLICY "Users can create verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Update products table RLS to allow all users to insert products
DROP POLICY IF EXISTS "Farmers can insert own products" ON public.products;

CREATE POLICY "Users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (farmer_id = auth.uid());

-- Update user_roles default role
ALTER TABLE public.user_roles 
  ALTER COLUMN role SET DEFAULT 'buyer';

-- Create a function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_verified FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;