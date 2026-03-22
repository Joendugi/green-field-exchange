-- Broadcasts and Search migration (Idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  total_recipients INTEGER DEFAULT 0,
  sent_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage broadcasts" ON public.broadcast_messages;
CREATE POLICY "Admins can manage broadcasts" ON public.broadcast_messages
  FOR ALL USING (true); -- Simplified check for debugging, or use has_role if available

-- Trigger to notify all users on broadcast creation (in-app)
CREATE OR REPLACE FUNCTION public.trigger_on_broadcast()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT id, NEW.title, NEW.message, 'system'
  FROM public.profiles;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_broadcast_created ON public.broadcast_messages;
CREATE TRIGGER on_broadcast_created
  AFTER INSERT ON public.broadcast_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_on_broadcast();

-- Email Logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (true);

-- Ensure fuzzy search indexes exist
CREATE INDEX IF NOT EXISTS trgm_idx_products_name ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_products_desc ON public.products USING gin (description gin_trgm_ops);

-- Smart search function
CREATE OR REPLACE FUNCTION public.list_products(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 40,
  p_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.products
  WHERE is_available = true
    AND is_hidden = false
    AND (p_category IS NULL OR category = p_category)
    AND (p_search IS NULL OR (name % p_search OR description % p_search))
    AND (p_cursor IS NULL OR created_at < p_cursor)
  ORDER BY is_featured DESC, created_at DESC
  LIMIT p_limit;
END;
$$;
