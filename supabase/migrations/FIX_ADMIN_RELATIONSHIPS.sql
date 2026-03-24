-- ============================================================================
-- FIX ADMIN DASHBOARD RELATIONSHIP ERRORS
-- Run this in Supabase SQL Editor to fix all 400 Bad Request errors
-- ============================================================================

-- ============================================================================
-- STEP 1: Auto-create missing profiles for any auth users in user_roles
-- This prevents FK constraint violations when those users have no profile yet.
-- ============================================================================
INSERT INTO public.profiles (user_id, email, username, full_name)
SELECT 
  au.id,
  au.email,
  split_part(au.email, '@', 1) || '_' || substr(au.id::text, 1, 6),  -- unique username
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE au.id IN (SELECT user_id FROM public.user_roles)
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Also create profiles for ALL auth users without profiles (general fix)
INSERT INTO public.profiles (user_id, email, username, full_name)
SELECT 
  au.id,
  au.email,
  split_part(au.email, '@', 1) || '_' || substr(au.id::text, 1, 6),
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Fix profiles <-> user_roles join
-- Adds FK so PostgREST can auto-join profiles?select=*,user_roles(role)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE user_roles
      ADD CONSTRAINT user_roles_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(user_id)
      ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Fix posts <-> profiles join
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(user_id)
      ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Fix verification_requests <-> profiles join
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verification_requests_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE verification_requests
      ADD CONSTRAINT verification_requests_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(user_id)
      ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Ensure email_logs table exists with correct structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  resend_id TEXT DEFAULT NULL,
  error TEXT DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: Fix all RLS policies using has_role() consistently
-- ============================================================================
-- email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public can insert email logs" ON public.email_logs;
CREATE POLICY "Public can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view own verification requests" ON public.verification_requests
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create verification requests" ON public.verification_requests;
CREATE POLICY "Users can create verification requests" ON public.verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update verification requests" ON public.verification_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- profiles (admin read)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- STEP 7: Set up auto-profile trigger for future signups
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 6),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Done! 
-- IMPORTANT: After running, go to Supabase Dashboard -> Settings -> API
-- and click "Reload Schema Cache" so PostgREST picks up the new FK relationships.
-- ============================================================================
SELECT 'All fixes applied! Remember to reload the schema cache in Supabase Dashboard.' AS result;
