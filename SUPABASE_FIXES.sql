-- ============================================================================
-- CRITICAL FIXES FOR SUPABASE (Run this in Supabase SQL Editor)
-- ============================================================================

-- ENSURE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  DROP CONSTRAINT IF EXISTS products_farmer_id_fkey,
  DROP CONSTRAINT IF EXISTS products_farmer_id_profiles_fkey;

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

-- 5. FIX IMAGE STORAGE ISSUES
-- Add image_storage_path to products if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- Create buckets (Needs to be done via Supabase Dashboard or API, but this SQL might work depending on permissions)
-- If these fail, please create 'product_images', 'post-media', 'avatars', and 'verification_documents' buckets manually in Supabase Storage.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification_documents', 'verification_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Allow public read, authenticated upload)
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (auth.uid() = owner);

-- 6. SUPPORT TICKETS SYSTEM
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert a ticket" ON public.support_tickets;
CREATE POLICY "Anyone can insert a ticket" ON public.support_tickets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR SELECT TO authenticated
    USING (public.check_is_admin() = true);

DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Admins can update tickets" ON public.support_tickets
    FOR UPDATE TO authenticated
    USING (public.check_is_admin() = true);

-- 7. SECURITY: RATE LIMITING
-- This prevents abuse of help requests and message sending.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_action TEXT,
    p_limit_seconds INTEGER,
    p_max_attempts INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Delete expired entries
    DELETE FROM public.rate_limits WHERE expires_at < NOW();
    
    -- Count recent attempts
    SELECT count INTO v_count 
    FROM public.rate_limits 
    WHERE key = p_key AND action = p_action;
    
    IF v_count IS NULL THEN
        INSERT INTO public.rate_limits (key, action, count, expires_at)
        VALUES (p_key, p_action, 1, NOW() + (p_limit_seconds || ' seconds')::INTERVAL);
        RETURN TRUE;
    ELSIF v_count < p_max_attempts THEN
        UPDATE public.rate_limits SET count = count + 1 WHERE key = p_key AND action = p_action;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT,
    action TEXT,
    count INTEGER,
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (key, action)
);

-- 8. SECURITY: ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit logs (Only admins)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (public.check_is_admin() = true);

-- 9. SECURITY: PRODUCTS RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view products" ON public.products;
CREATE POLICY "Public view products" ON public.products
    FOR SELECT USING (NOT hidden OR public.check_is_admin() = true);

DROP POLICY IF EXISTS "Farmers manage own products" ON public.products;
CREATE POLICY "Farmers manage own products" ON public.products
    FOR ALL TO authenticated
    USING (auth.uid() = farmer_id OR public.check_is_admin() = true);

-- 10. REPAIR EXISTING DATA
-- Mark current admin if needed (Replace with your actual user ID if you know it)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@example.com';
