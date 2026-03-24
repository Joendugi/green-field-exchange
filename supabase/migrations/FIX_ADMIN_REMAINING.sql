-- ============================================================================
-- FIX REMAINING ADMIN ERRORS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FIX 1: Create advertisements table (was returning 404)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  target_audience TEXT DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisements;
CREATE POLICY "Admins can manage advertisements" ON public.advertisements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;
CREATE POLICY "Public can view active advertisements" ON public.advertisements
  FOR SELECT USING (status = 'active');

-- ============================================================================
-- FIX 2: Ensure admin_settings has at least one row
-- (prevents 406 Not Acceptable when .single() finds 0 rows)
-- ============================================================================
INSERT INTO public.admin_settings (
  force_dark_mode,
  enable_beta_features,
  enable_ads_portal,
  enable_bulk_tools,
  updated_by
)
SELECT 
  false,
  true,
  false,
  false,
  id
FROM auth.users
WHERE email = 'joeeroctib@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.admin_settings)
LIMIT 1;

-- Fallback: if admin user doesn't exist yet, use the first admin role user
INSERT INTO public.admin_settings (
  force_dark_mode,
  enable_beta_features,
  enable_ads_portal,
  enable_bulk_tools,
  updated_by
)
SELECT 
  false,
  true,
  false,
  false,
  ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.admin_settings)
LIMIT 1;

-- ============================================================================
-- FIX 3: Also ensure the 'disputed' status is allowed on orders
-- (some schemas only allow pending/accepted/completed/cancelled)
-- ============================================================================
DO $$
BEGIN
  -- Drop old check constraint if it doesn't include 'disputed'
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_status_check' 
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'disputed', 'refunded'));
  END IF;
END $$;

SELECT 'Remaining admin fixes applied!' AS result;
