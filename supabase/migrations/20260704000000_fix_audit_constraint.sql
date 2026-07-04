-- ============================================================================
-- FIX: Admin Audit Logs constraint + trigger function for product updates
-- ============================================================================

-- 1. Drop the old overly-restrictive CHECK constraint
ALTER TABLE public.admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_target_type_check;

-- 2. Add expanded constraint that covers all values used by both
--    the application code AND the automated audit triggers (which use TG_TABLE_NAME)
ALTER TABLE public.admin_audit_logs ADD CONSTRAINT admin_audit_logs_target_type_check
CHECK (target_type IN (
  -- Application-level (singular) values used in admin.ts logAdminAction()
  'user', 'product', 'post', 'settings', 'verification', 'order', 'review', 'moderation', 'system',
  -- Trigger-level (table name) values from audit_table_change()
  'products', 'posts', 'user_roles', 'verification_requests', 'job_openings', 'job_applications',
  -- Support tickets
  'support_tickets', 'ticket'
));

-- 3. Replace the audit_table_change() function with one that maps
--    plural table names to their singular target_type equivalents
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_action TEXT := TG_OP;
    v_details TEXT;
    v_target_id TEXT;
    v_target_type TEXT;
BEGIN
    -- Map table names to canonical singular target_type
    CASE TG_TABLE_NAME
        WHEN 'products' THEN v_target_type := 'product';
        WHEN 'posts' THEN v_target_type := 'post';
        WHEN 'user_roles' THEN v_target_type := 'user';
        WHEN 'verification_requests' THEN v_target_type := 'verification';
        WHEN 'job_openings' THEN v_target_type := 'system';
        WHEN 'job_applications' THEN v_target_type := 'system';
        WHEN 'support_tickets' THEN v_target_type := 'ticket';
        ELSE v_target_type := TG_TABLE_NAME;
    END CASE;

    IF (TG_OP = 'INSERT') THEN
        v_target_id := NEW.id::text;
        v_details := 'Created new ' || TG_TABLE_NAME;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_target_id := OLD.id::text;
        v_details := 'Updated ' || TG_TABLE_NAME;
    ELSIF (TG_OP = 'DELETE') THEN
        v_target_id := OLD.id::text;
        v_details := 'Deleted ' || TG_TABLE_NAME;
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_id, 
        action, 
        target_type, 
        target_id, 
        details, 
        metadata
    ) VALUES (
        v_user_id, 
        v_action, 
        v_target_type, 
        v_target_id, 
        v_details, 
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA
        )
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-apply triggers (they'll use the updated function)
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS audit_verification_requests_trigger ON public.verification_requests;
CREATE TRIGGER audit_verification_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS audit_job_openings_trigger ON public.job_openings;
CREATE TRIGGER audit_job_openings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.job_openings
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

-- 5. Fix products RLS policy — use correct column name is_hidden (not hidden)
DROP POLICY IF EXISTS "Public view products" ON public.products;
CREATE POLICY "Public view products" ON public.products
    FOR SELECT USING (NOT is_hidden OR public.check_is_admin() = true);
