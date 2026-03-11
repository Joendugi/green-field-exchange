-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  type TEXT DEFAULT NULL, -- "order", "message", "verification", "system", "promotion"
  link TEXT DEFAULT NULL, -- URL to navigate to when clicked
  metadata JSONB DEFAULT NULL, -- Additional structured data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow service role to insert notifications

-- Functions
CREATE OR REPLACE FUNCTION get_my_notifications(p_unread_only BOOLEAN DEFAULT false, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  is_read BOOLEAN,
  type TEXT,
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.is_read,
    n.type,
    n.link,
    n.metadata,
    n.created_at
  FROM notifications n
  WHERE n.user_id = auth.uid()
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_link, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create common notification types
CREATE OR REPLACE FUNCTION notify_new_order(p_order_id UUID)
RETURNS void AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT o.buyer_id, o.farmer_id, p.name
  INTO v_order
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = p_order_id;
  
  -- Notify farmer
  PERFORM create_notification(
    v_order.farmer_id,
    'New Order Received',
    'You have a new order for ' || v_order.name,
    'order',
    '/orders/' || p_order_id,
    jsonb_build_object('order_id', p_order_id)
  );
  
  -- Notify buyer
  PERFORM create_notification(
    v_order.buyer_id,
    'Order Placed',
    'Your order for ' || v_order.name || ' has been placed',
    'order',
    '/orders/' || p_order_id,
    jsonb_build_object('order_id', p_order_id)
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_message(p_conversation_id UUID, p_sender_id UUID, p_message TEXT)
RETURNS void AS $$
DECLARE
  v_other_user_id UUID;
BEGIN
  -- Find the other participant in the conversation
  SELECT CASE 
    WHEN participant1_id = p_sender_id THEN participant2_id
    ELSE participant1_id
  END INTO v_other_user_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Notify the other user
  PERFORM create_notification(
    v_other_user_id,
    'New Message',
    LEFT(p_message, 100) || (CASE WHEN LENGTH(p_message) > 100 THEN '...' ELSE '' END),
    'message',
    '/messages/' || p_conversation_id,
    jsonb_build_object('conversation_id', p_conversation_id, 'sender_id', p_sender_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-notify on new messages
CREATE OR REPLACE FUNCTION trigger_new_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_new_message(NEW.conversation_id, NEW.sender_id, NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_message_notification();
