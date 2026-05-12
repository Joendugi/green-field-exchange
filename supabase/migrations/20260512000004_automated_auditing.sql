-- Phase 2 Hardening: Automated Auditing Triggers

-- 1. Relax admin_id constraint to allow for system/user automated logs
ALTER TABLE public.admin_audit_logs ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Audit Function
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_action TEXT := TG_OP;
    v_details TEXT;
    v_target_id TEXT;
BEGIN
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
        TG_TABLE_NAME, 
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

-- 3. Apply Triggers to Critical Tables
-- Products
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

-- User Roles
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

-- Verification Requests
DROP TRIGGER IF EXISTS audit_verification_requests_trigger ON public.verification_requests;
CREATE TRIGGER audit_verification_requests_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

-- Job Openings
DROP TRIGGER IF EXISTS audit_job_openings_trigger ON public.job_openings;
CREATE TRIGGER audit_job_openings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.job_openings
FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();
