-- ============================================================================
-- KNOWLEDGE BASE CHAT SYSTEM
-- Store chat conversations and message history
-- ============================================================================

-- ============================================================================
-- 1. KB CHAT CONVERSATIONS (Store user chat sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES lightpoint_users(id) ON DELETE CASCADE,
  
  -- Conversation details
  title TEXT, -- Auto-generated from first message
  summary TEXT, -- AI-generated summary of conversation
  
  -- Metadata
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_kb_chat_conversations_user ON kb_chat_conversations(user_id, last_message_at DESC);

-- ============================================================================
-- 2. KB CHAT MESSAGES (Store individual messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES kb_chat_conversations(id) ON DELETE CASCADE,
  
  -- Message details
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Context used for this message
  knowledge_base_chunks JSONB, -- KB excerpts used to answer
  sources JSONB, -- Citations/references used
  
  -- Metadata
  token_count INTEGER,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for conversation lookups
CREATE INDEX IF NOT EXISTS idx_kb_chat_messages_conversation ON kb_chat_messages(conversation_id, created_at ASC);

-- ============================================================================
-- 3. KB CHAT FEEDBACK (Track helpful/not helpful responses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES kb_chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES lightpoint_users(id) ON DELETE CASCADE,
  
  -- Feedback
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(message_id, user_id) -- One feedback per user per message
);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to get recent conversations for a user
CREATE OR REPLACE FUNCTION get_user_kb_conversations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  message_count INTEGER,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.summary,
    c.message_count,
    c.last_message_at,
    c.created_at
  FROM kb_chat_conversations c
  WHERE c.user_id = p_user_id
  ORDER BY c.last_message_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to update conversation stats after new message
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kb_chat_conversations
  SET 
    message_count = message_count + 1,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats
CREATE TRIGGER trigger_update_conversation_stats
  AFTER INSERT ON kb_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE kb_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chat_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can manage own conversations" ON kb_chat_conversations
  FOR ALL USING (user_id = auth.uid());

-- Users can only see messages from their conversations
CREATE POLICY "Users can view own messages" ON kb_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kb_chat_conversations
      WHERE id = kb_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can insert messages to their conversations
CREATE POLICY "Users can add messages to own conversations" ON kb_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kb_chat_conversations
      WHERE id = kb_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can manage their own feedback
CREATE POLICY "Users can manage own feedback" ON kb_chat_feedback
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Knowledge Base Chat System setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - kb_chat_conversations (chat sessions)';
  RAISE NOTICE '  - kb_chat_messages (message history)';
  RAISE NOTICE '  - kb_chat_feedback (helpful ratings)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  ✓ Multi-turn conversations with context';
  RAISE NOTICE '  ✓ Message history and sources';
  RAISE NOTICE '  ✓ Automatic conversation summaries';
  RAISE NOTICE '  ✓ Feedback tracking';
  RAISE NOTICE '  ✓ RLS for user privacy';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for: Knowledge Base Chat UI';
END $$;

