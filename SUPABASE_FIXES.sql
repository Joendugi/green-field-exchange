-- ============================================================================
-- CRITICAL FIXES FOR SUPABASE (Run this in Supabase SQL Editor)
-- ============================================================================

-- 1. ADD ADMIN FLAG TO PROFILES (Faster policy checks)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. FIX INFINITE RECURSION IN user_roles
-- We use a SECURITY DEFINER function to break the policy recursion loop.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.check_is_admin() = true
    OR user_id = auth.uid()
  );

-- 3. FIX PRODUCT-PROFILE RELATIONSHIP
-- This allows the JOIN used in the frontend (.select("*, profiles:profiles(...)"))
-- First, ensure every product has a farmer_id that exists in profiles
INSERT INTO public.profiles (id, username, email)
SELECT DISTINCT farmer_id, 'user_' || farmer_id, 'user_' || farmer_id || '@placeholder.com'
FROM public.products
WHERE farmer_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Now add the explicit foreign key
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_farmer_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_farmer_id_profiles_fkey 
  FOREIGN KEY (farmer_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;


-- 4. ENSURE PROFILES ARE AUTO-CREATED
-- This prevents "Profile not found" errors when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name, onboarded)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign default 'buyer' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. REPAIR EXISTING DATA
-- Mark current admin if needed (Replace with your actual user ID if you know it)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@example.com';
