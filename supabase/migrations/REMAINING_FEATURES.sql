-- ============================================================================
-- REMAINING FEATURES MIGRATION
-- Social, Analytics, Marketing, and Utility Features
-- ============================================================================
-- Run this after FULL_MIGRATION.sql to complete the database schema
-- ============================================================================

-- ============================================================================
-- USER SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notifications_orders BOOLEAN NOT NULL DEFAULT true,
  notifications_social BOOLEAN NOT NULL DEFAULT true,
  notifications_system BOOLEAN NOT NULL DEFAULT true,
  ai_assistant_enabled BOOLEAN NOT NULL DEFAULT true,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SOCIAL CONTENT SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  reposts_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'social' CHECK (type IN ('social', 'question', 'advice', 'guide')),
  tags TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_post_repost UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON post_reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON post_reposts(post_id);

-- ============================================================================
-- FOLLOWS SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_id, following_id);

-- ============================================================================
-- META ADS AND ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS meta_pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT DEFAULT NULL,
  value NUMERIC DEFAULT NULL,
  currency TEXT DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT NOT NULL,
  ip_address TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meta_pixel_events_timestamp ON meta_pixel_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meta_pixel_events_user_id ON meta_pixel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_pixel_events_event_name ON meta_pixel_events(event_name);

CREATE TABLE IF NOT EXISTS meta_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_type TEXT NOT NULL,
  conversion_data JSONB DEFAULT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  value NUMERIC DEFAULT NULL,
  currency TEXT DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT NOT NULL,
  ip_address TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meta_conversions_timestamp ON meta_conversions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meta_conversions_user_id ON meta_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_conversions_conversion_type ON meta_conversions(conversion_type);

CREATE TABLE IF NOT EXISTS meta_custom_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_name TEXT NOT NULL,
  audience_description TEXT NOT NULL,
  audience_type TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_meta_custom_audiences_created_by ON meta_custom_audiences(created_by);
CREATE INDEX IF NOT EXISTS idx_meta_custom_audiences_audience_type ON meta_custom_audiences(audience_type);
CREATE INDEX IF NOT EXISTS idx_meta_custom_audiences_is_active ON meta_custom_audiences(is_active);

CREATE TABLE IF NOT EXISTS meta_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_objective TEXT NOT NULL,
  budget NUMERIC NOT NULL CHECK (budget >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  target_audience UUID REFERENCES meta_custom_audiences(id) ON DELETE SET NULL,
  creative_assets JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metrics JSONB NOT NULL DEFAULT '{
    "impressions": 0,
    "clicks": 0,
    "conversions": 0,
    "spend": 0,
    "ctr": 0,
    "cpc": 0,
    "cpm": 0
  }'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_campaigns_created_by ON meta_ad_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_meta_ad_campaigns_status ON meta_ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_meta_ad_campaigns_created_at ON meta_ad_campaigns(created_at DESC);

-- ============================================================================
-- EMAIL SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('broadcast', 'otp', 'ban', 'role_change', 'order', 'message', 'verification', 'announcement')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_id TEXT DEFAULT NULL,
  error TEXT DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_timestamp ON email_logs(timestamp DESC);

-- ============================================================================
-- PASSWORD RESET SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- PRICE HISTORY ANALYTICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_category_location ON price_history(category, location);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- ============================================================================
-- AI CHAT HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ============================================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_custom_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Posts RLS
CREATE POLICY "Public can view non-hidden posts" ON posts
  FOR SELECT USING (is_hidden = false OR auth.uid() = user_id);

CREATE POLICY "Users can manage own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all posts" ON posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Post Likes RLS
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own post likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Post Comments RLS
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own post comments" ON post_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all post comments" ON post_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Post Reposts RLS
CREATE POLICY "Users can view all post reposts" ON post_reposts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own post reposts" ON post_reposts
  FOR ALL USING (auth.uid() = user_id);

-- Follows RLS
CREATE POLICY "Users can view own follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Public can view follow counts" ON follows
  FOR SELECT USING (true);

-- Meta Pixel Events RLS
CREATE POLICY "Admins can view pixel events" ON meta_pixel_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert pixel events" ON meta_pixel_events
  FOR INSERT WITH CHECK (true);

-- Meta Conversions RLS
CREATE POLICY "Admins can view conversions" ON meta_conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert conversions" ON meta_conversions
  FOR INSERT WITH CHECK (true);

-- Meta Custom Audiences RLS
CREATE POLICY "Users can view own audiences" ON meta_custom_audiences
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all audiences" ON meta_custom_audiences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own audiences" ON meta_custom_audiences
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all audiences" ON meta_custom_audiences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Meta Ad Campaigns RLS
CREATE POLICY "Users can view own campaigns" ON meta_ad_campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all campaigns" ON meta_ad_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own campaigns" ON meta_ad_campaigns
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all campaigns" ON meta_ad_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

-- Email Logs RLS
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Password Reset Tokens RLS
CREATE POLICY "Users can view own reset tokens" ON password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reset tokens" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own reset tokens" ON password_reset_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Price History RLS
CREATE POLICY "Public can view price history" ON price_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert price history" ON price_history
  FOR INSERT WITH CHECK (true);

-- AI Chat History RLS
CREATE POLICY "Users can view own chat history" ON ai_chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat history" ON ai_chat_history
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS FOR NEW FEATURES
-- ============================================================================

-- Create triggers for updated_at
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();
CREATE TRIGGER meta_ad_campaigns_updated_at BEFORE UPDATE ON meta_ad_campaigns FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- Social Feed Functions
CREATE OR REPLACE FUNCTION get_social_feed(p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  reposts_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  is_hidden BOOLEAN,
  is_featured BOOLEAN,
  type TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  profiles_username TEXT,
  profiles_full_name TEXT,
  profiles_avatar_url TEXT,
  profiles_verified BOOLEAN,
  user_has_liked BOOLEAN,
  user_has_reposted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.video_url,
    p.reposts_count,
    p.likes_count,
    p.comments_count,
    p.is_hidden,
    p.is_featured,
    p.type,
    p.tags,
    p.created_at,
    p.updated_at,
    pr.username as profiles_username,
    pr.full_name as profiles_full_name,
    pr.avatar_url as profiles_avatar_url,
    pr.verified as profiles_verified,
    EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = auth.uid()) as user_has_liked,
    EXISTS(SELECT 1 FROM post_reposts prp WHERE prp.post_id = p.id AND prp.user_id = auth.uid()) as user_has_reposted
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.is_hidden = false
    OR p.user_id = auth.uid()
  ORDER BY p.is_featured DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_posts(p_type TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  reposts_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  is_hidden BOOLEAN,
  is_featured BOOLEAN,
  type TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.video_url,
    p.reposts_count,
    p.likes_count,
    p.comments_count,
    p.is_hidden,
    p.is_featured,
    p.type,
    p.tags,
    p.created_at,
    p.updated_at
  FROM posts p
  WHERE p.user_id = auth.uid()
    AND (p_type IS NULL OR p.type = p_type)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_liked BOOLEAN;
  v_like_id UUID;
BEGIN
  -- Check if already liked
  SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = p_post_id AND user_id = auth.uid()) INTO v_is_liked;
  
  IF v_is_liked THEN
    -- Unlike
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = auth.uid();
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = p_post_id;
    RETURN false;
  ELSE
    -- Like
    INSERT INTO post_likes (post_id, user_id) VALUES (p_post_id, auth.uid());
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION repost_post(p_post_id UUID, p_content TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_repost_id UUID;
  v_original_post_user_id UUID;
BEGIN
  -- Get original post user_id
  SELECT user_id INTO v_original_post_user_id FROM posts WHERE id = p_post_id;
  
  IF v_original_post_user_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  IF v_original_post_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot repost own post';
  END IF;
  
  -- Create repost
  INSERT INTO post_reposts (post_id, user_id) VALUES (p_post_id, auth.uid());
  
  -- Update original post repost count
  UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = p_post_id;
  
  -- Create new post entry
  INSERT INTO posts (user_id, content, type, reposts_count)
  VALUES (auth.uid(), COALESCE(p_content, 'Shared a post'), 'social', 0)
  RETURNING id INTO v_repost_id;
  
  RETURN v_repost_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow Functions
CREATE OR REPLACE FUNCTION toggle_follow(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_following BOOLEAN;
BEGIN
  -- Check if already following
  SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = p_user_id) INTO v_is_following;
  
  IF v_is_following THEN
    -- Unfollow
    DELETE FROM follows WHERE follower_id = auth.uid() AND following_id = p_user_id;
    RETURN false;
  ELSE
    -- Follow
    INSERT INTO follows (follower_id, following_id) VALUES (auth.uid(), p_user_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_followers_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM follows WHERE following_id = p_user_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM follows WHERE follower_id = p_user_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Settings Functions
CREATE OR REPLACE FUNCTION get_my_settings()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  notifications_enabled BOOLEAN,
  notifications_orders BOOLEAN,
  notifications_social BOOLEAN,
  notifications_system BOOLEAN,
  ai_assistant_enabled BOOLEAN,
  dark_mode BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.notifications_enabled,
    us.notifications_orders,
    us.notifications_social,
    us.notifications_system,
    us.ai_assistant_enabled,
    us.dark_mode,
    us.created_at,
    us.updated_at
  FROM user_settings us
  WHERE us.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_my_settings(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notifications_orders BOOLEAN DEFAULT NULL,
  p_notifications_social BOOLEAN DEFAULT NULL,
  p_notifications_system BOOLEAN DEFAULT NULL,
  p_ai_assistant_enabled BOOLEAN DEFAULT NULL,
  p_dark_mode BOOLEAN DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE user_settings SET
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    notifications_orders = COALESCE(p_notifications_orders, notifications_orders),
    notifications_social = COALESCE(p_notifications_social, notifications_social),
    notifications_system = COALESCE(p_notifications_system, notifications_system),
    ai_assistant_enabled = COALESCE(p_ai_assistant_enabled, ai_assistant_enabled),
    dark_mode = COALESCE(p_dark_mode, dark_mode),
    updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AI Chat Functions
CREATE OR REPLACE FUNCTION get_my_chat_history(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ach.id,
    ach.user_id,
    ach.role,
    ach.content,
    ach.created_at
  FROM ai_chat_history ach
  WHERE ach.user_id = auth.uid()
  ORDER BY ach.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_ai_message(p_role TEXT, p_content TEXT)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO ai_chat_history (user_id, role, content)
  VALUES (auth.uid(), p_role, p_content)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Price History Functions
CREATE OR REPLACE FUNCTION get_price_history(p_category TEXT DEFAULT NULL, p_location TEXT DEFAULT NULL, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  category TEXT,
  location TEXT,
  price NUMERIC,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.id,
    ph.category,
    ph.location,
    ph.price,
    ph.recorded_at
  FROM price_history ph
  WHERE (p_category IS NULL OR ph.category = p_category)
    AND (p_location IS NULL OR ph.location = p_location)
    AND ph.recorded_at >= NOW() - INTERVAL '1 day' * p_days
  ORDER BY ph.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_price_point(p_category TEXT, p_location TEXT, p_price NUMERIC)
RETURNS void AS $$
BEGIN
  INSERT INTO price_history (category, location, price)
  VALUES (p_category, p_location, p_price);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Remaining features migration completed!
-- Your database now includes:
-- - User settings with RLS
-- - Complete social content system (posts, likes, comments, reposts)
-- - Follows system
-- - Meta ads and analytics platform
-- - Email logging system
-- - Password reset functionality
-- - Price history analytics
-- - AI chat history
-- - Complete RLS policies for all new features
-- - Useful functions for frontend integration
