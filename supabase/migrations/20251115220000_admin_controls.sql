-- Platform-level admin settings and RPC helpers

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  force_dark_mode BOOLEAN DEFAULT false,
  enable_beta_features BOOLEAN DEFAULT false,
  enable_ads_portal BOOLEAN DEFAULT true,
  enable_bulk_tools BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admin settings readable" ON public.admin_settings
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Only admins modify admin settings" ON public.admin_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.admin_settings (force_dark_mode, enable_beta_features, enable_ads_portal, enable_bulk_tools)
SELECT false, false, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RPC to handle verification approvals
CREATE OR REPLACE FUNCTION public.admin_handle_verification(
  _admin_id UUID,
  _request_id UUID,
  _approve BOOLEAN,
  _notes TEXT DEFAULT NULL
) RETURNS public.verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user UUID;
  result_row public.verification_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO target_user
  FROM public.verification_requests
  WHERE id = _request_id;

  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  UPDATE public.verification_requests
  SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      admin_notes = COALESCE(_notes, CASE WHEN _approve THEN 'Approved by admin' ELSE 'Rejected by admin' END),
      updated_at = now()
  WHERE id = _request_id
  RETURNING * INTO result_row;

  IF _approve THEN
    UPDATE public.user_roles
    SET is_verified = true
    WHERE user_id = target_user AND role = 'farmer';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    target_user,
    'verification',
    CASE WHEN _approve THEN 'Verification approved' ELSE 'Verification rejected' END,
    CASE WHEN _approve THEN 'Your documents have been approved by the admin team.' ELSE 'Your verification request was rejected. Please review your submission.' END,
    '/dashboard?tab=profile'
  );

  RETURN result_row;
END;
$$;

-- RPC to toggle bans
CREATE OR REPLACE FUNCTION public.admin_toggle_ban(
  _admin_id UUID,
  _target_user UUID,
  _ban BOOLEAN,
  _reason TEXT DEFAULT NULL
) RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles%ROWTYPE;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET is_banned = _ban,
      updated_at = now()
  WHERE id = _target_user
  RETURNING * INTO updated_profile;

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    _target_user,
    'enforcement',
    CASE WHEN _ban THEN 'Account banned' ELSE 'Account reinstated' END,
    COALESCE(_reason, CASE WHEN _ban THEN 'An admin has restricted your access.' ELSE 'Your access has been restored.' END)
  );

  RETURN updated_profile;
END;
$$;

-- RPC to upsert advertisements via a JSON payload
CREATE OR REPLACE FUNCTION public.admin_upsert_advertisement(
  _admin_id UUID,
  _payload JSONB
) RETURNS public.advertisements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_row public.advertisements%ROWTYPE;
  ad_id UUID;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _payload ? 'id' THEN
    ad_id := (_payload->>'id')::UUID;

    UPDATE public.advertisements
    SET title = COALESCE(_payload->>'title', title),
        body = COALESCE(_payload->>'body', body),
        image_url = COALESCE(_payload->>'image_url', image_url),
        cta_label = COALESCE(_payload->>'cta_label', cta_label),
        cta_link = COALESCE(_payload->>'cta_link', cta_link),
        is_active = COALESCE((_payload->>'is_active')::BOOLEAN, is_active),
        updated_by = _admin_id,
        updated_at = now()
    WHERE id = ad_id
    RETURNING * INTO result_row;
  ELSE
    INSERT INTO public.advertisements (title, body, image_url, cta_label, cta_link, is_active, created_by, updated_by)
    VALUES (
      COALESCE(_payload->>'title', 'Untitled placement'),
      _payload->>'body',
      _payload->>'image_url',
      _payload->>'cta_label',
      _payload->>'cta_link',
      COALESCE((_payload->>'is_active')::BOOLEAN, true),
      _admin_id,
      _admin_id
    )
    RETURNING * INTO result_row;
  END IF;

  RETURN result_row;
END;
$$;

-- RPC for bulk product tooling
CREATE OR REPLACE FUNCTION public.admin_bulk_product_action(
  _admin_id UUID,
  _action TEXT,
  _product_ids UUID[],
  _payload JSONB DEFAULT '{}'::JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
  percentage NUMERIC;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _product_ids IS NULL OR array_length(_product_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  IF _action = 'mark_unavailable' THEN
    UPDATE public.products
    SET is_available = false,
        updated_at = now()
    WHERE id = ANY(_product_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSIF _action = 'mark_available' THEN
    UPDATE public.products
    SET is_available = true,
        updated_at = now()
    WHERE id = ANY(_product_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSIF _action = 'adjust_price_percent' THEN
    percentage := COALESCE((_payload->>'percentage')::NUMERIC, 0);
    UPDATE public.products
    SET price = price * (1 + (percentage / 100.0)),
        updated_at = now()
    WHERE id = ANY(_product_ids);
    GET DIAGNOSTICS affected = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Unsupported action %', _action;
  END IF;

  RETURN affected;
END;
$$;
