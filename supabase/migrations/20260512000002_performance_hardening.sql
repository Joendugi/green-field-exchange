-- Performance Hardening: Adding indexes for frequently queried columns

-- Job Openings
CREATE INDEX IF NOT EXISTS idx_job_openings_active_featured ON public.job_openings(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON public.job_openings(department);

-- Job Applications
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Profiles & Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON public.admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);
