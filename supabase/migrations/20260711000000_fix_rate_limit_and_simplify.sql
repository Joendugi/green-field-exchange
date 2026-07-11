-- ============================================================
-- Fix: Recreate check_rate_limit so PostgREST picks it up
-- This ensures the function exists and is accessible to both
-- anon and authenticated roles without schema cache issues.
-- ============================================================

-- Drop all existing overloads first so we start clean
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT);

-- Recreate with explicit named parameters matching what the client sends
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_action TEXT,
  p_limit_seconds INTEGER DEFAULT 60,
  p_max_attempts INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  -- Ensure rate_limit_tracking table exists (defensive)
  -- Count recent attempts within the time window
  SELECT COUNT(*) INTO v_recent_count
  FROM rate_limit_tracking
  WHERE key = p_key
    AND action = p_action
    AND timestamp > NOW() - (p_limit_seconds || ' seconds')::INTERVAL;

  -- If under limit, log this attempt and allow
  IF v_recent_count < p_max_attempts THEN
    INSERT INTO rate_limit_tracking (key, action)
    VALUES (p_key, p_action);
    RETURN true;
  END IF;

  -- Over limit — deny
  RETURN false;
END;
$$;

-- Grant access to both anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
