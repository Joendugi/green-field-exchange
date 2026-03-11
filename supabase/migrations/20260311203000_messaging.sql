-- Messaging system: conversations and messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conversation CHECK (participant1_id < participant2_id)
);

CREATE UNIQUE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Messages RLS
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update read status of messages sent to them" ON messages
  FOR UPDATE USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
  id UUID,
  participant1_id UUID,
  participant2_id UUID,
  last_message TEXT,
  last_sender_id UUID,
  updated_at TIMESTAMPTZ,
  other_user_id UUID,
  other_user_full_name TEXT,
  other_user_avatar_url TEXT,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.participant1_id,
    c.participant2_id,
    c.last_message,
    c.last_sender_id,
    c.updated_at,
    CASE 
      WHEN c.participant1_id = auth.uid() THEN c.participant2_id
      ELSE c.participant1_id
    END as other_user_id,
    CASE 
      WHEN c.participant1_id = auth.uid() THEN p2.full_name
      ELSE p1.full_name
    END as other_user_full_name,
    CASE 
      WHEN c.participant1_id = auth.uid() THEN p2.avatar_url
      ELSE p1.avatar_url
    END as other_user_avatar_url,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.is_read = false
        AND m.sender_id != auth.uid()
    ) as unread_count
  FROM conversations c
  LEFT JOIN profiles p1 ON c.participant1_id = p1.id
  LEFT JOIN profiles p2 ON c.participant2_id = p2.id
  WHERE c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  sender_full_name TEXT,
  sender_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.is_read,
    m.created_at,
    p.full_name as sender_full_name,
    p.avatar_url as sender_avatar_url
  FROM messages m
  LEFT JOIN profiles p ON m.sender_id = p.id
  WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = p_conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_message(p_conversation_id UUID, p_content TEXT)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_other_user_id UUID;
BEGIN
  -- Verify user is part of conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = p_conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized for this conversation';
  END IF;

  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, auth.uid(), p_content)
  RETURNING id INTO v_message_id;

  -- Update conversation's last_message and updated_at
  UPDATE conversations
  SET 
    last_message = p_content,
    last_sender_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_or_create_conversation(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (participant1_id = v_user_id AND participant2_id = p_other_user_id)
     OR (participant1_id = p_other_user_id AND participant2_id = v_user_id);

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (participant1_id, participant2_id)
  VALUES (
    LEAST(v_user_id, p_other_user_id),
    GREATEST(v_user_id, p_other_user_id)
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_messages_read(p_conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();
