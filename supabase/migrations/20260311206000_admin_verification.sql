-- Admin and verification tables
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_more_info')),
  documents TEXT[] DEFAULT NULL, -- Array of document URLs/paths
  admin_notes TEXT DEFAULT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_created_at ON verification_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id TEXT DEFAULT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'product', 'post', 'settings', 'verification', 'order', 'review')),
  details TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  force_dark_mode BOOLEAN NOT NULL DEFAULT false,
  enable_beta_features BOOLEAN NOT NULL DEFAULT true,
  enable_ads_portal BOOLEAN NOT NULL DEFAULT false,
  enable_bulk_tools BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one row should exist in admin_settings
CREATE UNIQUE INDEX idx_admin_settings_single ON admin_settings((true));

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);

CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL, -- userId or IP address
  action TEXT NOT NULL, -- action being rate limited
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_key_action ON rate_limit_tracking(key, action);
CREATE INDEX idx_rate_limit_timestamp ON rate_limit_tracking(timestamp DESC);

-- RLS Policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Verification Requests RLS
CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests" ON verification_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification requests" ON verification_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Admin Audit Logs RLS
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can create audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Admin Settings RLS
CREATE POLICY "Admins can manage settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Login Attempts RLS (read-only for admins)
CREATE POLICY "Admins can view login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Rate Limit Tracking RLS (service role only)
CREATE POLICY "Service role full access to rate limits" ON rate_limit_tracking
  FOR ALL USING (true);

-- Functions
CREATE OR REPLACE FUNCTION get_my_verification_request()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  documents TEXT[],
  admin_notes TEXT,
  admin_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vr.id,
    vr.user_id,
    vr.status,
    vr.documents,
    vr.admin_notes,
    vr.admin_id,
    vr.created_at,
    vr.updated_at
  FROM verification_requests vr
  WHERE vr.user_id = auth.uid()
  ORDER BY vr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_all_verification_requests(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  documents TEXT[],
  admin_notes TEXT,
  admin_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_full_name TEXT,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vr.id,
    vr.user_id,
    vr.status,
    vr.documents,
    vr.admin_notes,
    vr.admin_id,
    vr.created_at,
    vr.updated_at,
    p.full_name as user_full_name,
    au.email as user_email
  FROM verification_requests vr
  LEFT JOIN profiles p ON vr.user_id = p.id
  LEFT JOIN auth.users au ON vr.user_id = au.id
  WHERE (p_status IS NULL OR vr.status = p_status)
  ORDER BY vr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_verification_request(p_documents TEXT[] DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing pending request
  SELECT id INTO v_existing_id
  FROM verification_requests
  WHERE user_id = auth.uid()
    AND status = 'pending';

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending verification request';
  END IF;

  -- Create new request
  INSERT INTO verification_requests (user_id, documents)
  VALUES (auth.uid(), p_documents)
  RETURNING id INTO v_request_id;

  -- Log audit action
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'create_verification_request', 'verification', v_request_id, 'User submitted verification request');

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_verification_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Update request
  UPDATE verification_requests
  SET 
    status = p_status,
    admin_notes = p_admin_notes,
    admin_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Update user verification status if approved
  IF p_status = 'approved' THEN
    UPDATE profiles
    SET verified = true
    WHERE id = (SELECT user_id FROM verification_requests WHERE id = p_request_id);
  ELSIF p_status = 'rejected' THEN
    UPDATE profiles
    SET verified = false, verification_requested = false
    WHERE id = (SELECT user_id FROM verification_requests WHERE id = p_request_id);
  END IF;

  -- Log audit action
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'update_verification_request', 'verification', p_request_id, 
          'Status updated to: ' || p_status || COALESCE('. Notes: ' || p_admin_notes, ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_action TEXT, p_limit_seconds INTEGER DEFAULT 60, p_max_attempts INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  -- Count recent attempts
  SELECT COUNT(*) INTO v_recent_count
  FROM rate_limit_tracking
  WHERE key = p_key
    AND action = p_action
    AND timestamp > NOW() - INTERVAL '1 second' * p_limit_seconds;

  -- If under limit, log this attempt and allow
  IF v_recent_count < p_max_attempts THEN
    INSERT INTO rate_limit_tracking (key, action)
    VALUES (p_key, p_action);
    RETURN true;
  END IF;

  -- Over limit
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER verification_requests_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

-- Initialize admin settings if empty
INSERT INTO admin_settings (force_dark_mode, enable_beta_features, enable_ads_portal, enable_bulk_tools, updated_by)
SELECT false, true, false, false, id
FROM auth.users
WHERE email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM admin_settings)
LIMIT 1;
