-- 1. Drop the check constraint on target_type so any type can be logged without throwing errors
ALTER TABLE public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_target_type_check;

-- 2. Explicitly grant execute permissions on check_rate_limit functions to anon and authenticated roles
-- This ensures public (unauthenticated) users can submit support tickets on the Contact page
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;

-- Also grant execute on the version with default parameters if it exists as an overload
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_rate_limit' 
          AND proargtypes::regtype[] = ARRAY['text'::regtype, 'text'::regtype, 'integer'::regtype, 'integer'::regtype]
    ) THEN
        GRANT EXECUTE ON FUNCTION public.check_rate_limit(p_key TEXT, p_action TEXT, p_limit_seconds INTEGER, p_max_attempts INTEGER) TO anon, authenticated;
    END IF;
END $$;
