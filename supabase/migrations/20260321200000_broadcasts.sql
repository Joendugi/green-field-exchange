-- Broadcasts migration
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

CREATE POLICY "Admins can manage broadcasts" ON public.broadcast_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to notify all users on broadcast creation (in-app)
CREATE OR REPLACE FUNCTION public.trigger_on_broadcast()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into notifications for all users (caution: large table insert)
  -- In a real high-traffic app, this would be a background job
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT id, NEW.title, NEW.message, 'system'
  FROM public.profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
