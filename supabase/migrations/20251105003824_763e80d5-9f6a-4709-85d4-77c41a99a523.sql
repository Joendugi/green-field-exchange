-- Add machinery to product categories
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'machinery';

-- Create user_settings table for preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  ai_assistant_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add trigger for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add video support and repost functionality to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_repost BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create reposts tracking table
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reposts viewable by everyone" ON public.post_reposts
  FOR SELECT USING (true);

CREATE POLICY "Users can repost" ON public.post_reposts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unrepost" ON public.post_reposts
  FOR DELETE USING (user_id = auth.uid());

-- Add onboarding completion tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;