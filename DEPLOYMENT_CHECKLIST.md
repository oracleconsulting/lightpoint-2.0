# Knowledge Base System - Deployment Checklist

## ✅ Pre-Deployment (Run Once)

### 1. Database Setup
Run these SQL scripts in Supabase SQL Editor **in this order**:

```sql
-- 1. Knowledge Base Management Tables
-- File: supabase/SETUP_KNOWLEDGE_BASE_MANAGEMENT.sql
-- Creates: knowledge_base, knowledge_base_staging, knowledge_base_updates, rss_feeds, rss_feed_items
```

```sql
-- 2. AI Prompt Management Tables
-- File: supabase/SETUP_AI_PROMPT_MANAGEMENT.sql
-- Creates: ai_prompts, ai_prompt_history, ai_prompt_tests
-- Seeds: 5 default prompts
```

```sql
-- 3. Knowledge Base Chat Tables
-- File: supabase/SETUP_KB_CHAT.sql
-- Creates: kb_chat_conversations, kb_chat_messages, kb_chat_feedback
```

**Verify Setup:**
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'knowledge_base',
  'knowledge_base_staging',
  'knowledge_base_updates',
  'rss_feeds',
  'rss_feed_items',
  'ai_prompts',
  'ai_prompt_history',
  'ai_prompt_tests',
  'kb_chat_conversations',
  'kb_chat_messages',
  'kb_chat_feedback'
);
-- Should return 11 rows
```

### 2. Environment Variables
Ensure these are set in Railway:

```bash
# Supabase (already set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenRouter (already set)
OPENROUTER_API_KEY=sk-or-...

# App URL (already set)
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

No new environment variables needed! ✅

---

## 🚀 Post-Deployment Testing

### Test 1: Knowledge Base Chat
1. Log in as admin (`jhoward@rpgcc.co.uk`)
2. Navigate to **Knowledge Base**
3. Click **"Ask Questions"** tab
4. Ask: "What are the HMRC complaint procedures?"
5. **Expected**: AI responds with sources from existing knowledge base

### Test 2: Document Upload
1. Stay in **Knowledge Base**
2. Click **"Upload & Compare"** tab
3. Upload 1-2 test PDFs (start small)
4. **Expected**: 
   - Processing indicator appears
   - AI comparison results show
   - Can approve/reject documents

### Test 3: Browse Knowledge
1. Click **"Browse Knowledge"** tab
2. **Expected**: See existing knowledge base entries
3. Use search to filter
4. **Expected**: Search works correctly

### Test 4: Timeline
1. Click **"Update Timeline"** tab
2. **Expected**: See log of all KB changes
3. After approving a document, refresh
4. **Expected**: New entry appears in timeline

### Test 5: AI Settings
1. Go to **Dashboard**
2. Click **"AI Settings"** link (admin only)
3. **Expected**: See 5 default prompts
4. Click a prompt to view/edit
5. **Expected**: Can view prompt details and history

---

## 📋 Upload Your 64 CHG Documents

### Step-by-Step Process

**1. Organize Files**
- Ensure all 64 PDFs are in one folder
- Check that none are scanned (need OCR first)

**2. Start Upload**
- Knowledge Base → Upload & Compare
- Select all 64 files
- Click "Upload & Compare Against Existing Knowledge"

**3. Wait for Processing**
- Takes ~5-10 minutes for 64 documents
- Progress shows: "Processing 1 of 64: CHG-Section-1.pdf"
- Don't close the browser tab!

**4. Review Results**
- Each document gets a comparison card
- Green badges = safe to approve
- Red badges = likely duplicates
- Review AI recommendations

**5. Bulk Approve**
Strategy:
- First 10: Review carefully to understand AI patterns
- Next 30: Quick review of high-confidence (>90%) documents
- Last 24: Spot-check a few, trust the AI for rest

**6. Monitor Timeline**
- Go to Timeline tab
- Verify all approved documents appear
- Check categories make sense

---

## 🔍 Verification Queries

After uploading, run these in Supabase SQL Editor to verify:

### Check Document Count
```sql
SELECT COUNT(*) as total_documents 
FROM knowledge_base 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';
-- Should be close to 64 (minus duplicates)
```

### Check Categories
```sql
SELECT category, COUNT(*) as doc_count 
FROM knowledge_base 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
GROUP BY category 
ORDER BY doc_count DESC;
-- Shows distribution of documents across categories
```

### Check Timeline
```sql
SELECT 
  action,
  category,
  title,
  user_name,
  created_at
FROM knowledge_base_updates 
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC 
LIMIT 20;
-- Shows last 20 changes
```

### Check Chat History
```sql
SELECT 
  c.title,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message
FROM kb_chat_conversations c
LEFT JOIN kb_chat_messages m ON m.conversation_id = c.id
WHERE c.user_id = (SELECT id FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk')
GROUP BY c.id, c.title
ORDER BY last_message DESC;
-- Shows your chat conversations
```

---

## 🐛 Troubleshooting

### "Processing stuck at 0%"
**Check:**
- Railway logs for errors
- Browser console for JavaScript errors
- Network tab for failed API calls

**Fix:**
- Refresh page and try again
- Upload in smaller batches (10-20 files)

### "AI comparison fails"
**Check:**
- OpenRouter API key is valid
- OpenRouter has available credits
- Railway logs for specific error

**Fix:**
- Verify OPENROUTER_API_KEY in Railway
- Check OpenRouter dashboard for usage/limits

### "Can't see uploaded documents"
**Check:**
- Did you click "Approve & Add"?
- Documents in staging need approval to appear

**Fix:**
- Go back to Upload tab
- Review and approve pending comparisons

### "Chat gives empty responses"
**Check:**
- Knowledge base has documents
- OpenRouter API is working

**Fix:**
- Upload at least 1 document first
- Check Railway logs for specific errors

---

## 📊 Success Metrics

After full deployment, you should have:

- ✅ 60+ CHG documents in knowledge base
- ✅ Categorized by topic (Complaints, Escalation, Adjudicator, etc.)
- ✅ Chat responds with CHG-specific guidance
- ✅ Timeline shows all upload history
- ✅ AI Settings accessible and editable
- ✅ Complaint analysis uses CHG knowledge
- ✅ Letter generation cites CHG guidance

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Run 3 SQL scripts
2. ✅ Test chat with 1-2 questions
3. ✅ Upload 2-3 test documents
4. ✅ Upload all 64 CHG documents
5. ✅ Verify timeline and categories

### Short-term (This Week)
1. Test complaint analysis with CHG knowledge
2. Generate a test complaint letter
3. Verify CHG guidance is being cited
4. Test chat with specific CHG questions
5. Add any missing guidance documents

### Long-term (Next 2 Weeks)
1. Configure RSS feeds for auto-updates
2. Fine-tune AI prompts based on results
3. Add more precedent cases
4. Train team on Knowledge Base features
5. Set up admin review workflow

---

## 🆘 Support

If you encounter issues:

1. **Check Railway Logs**: Most errors appear here first
2. **Check Supabase Logs**: Database/RLS issues
3. **Check Browser Console**: Frontend errors
4. **Check Network Tab**: API call failures

**Common Issues:**
- Build fails → Check for missing imports
- API fails → Check environment variables
- RLS blocks action → Check user permissions
- Slow performance → Check document sizes

---

## ✨ Feature Highlights

### What You Now Have:

**1. Intelligent Upload**
- Multi-format support (PDF, Word, Excel, CSV, TXT)
- Automatic text extraction
- AI-powered duplicate detection
- Conflict resolution

**2. Knowledge Base Chat**
- Conversational AI (Claude Opus 4.1)
- Source citations
- Message history
- Feedback collection

**3. AI Settings Portal**
- View/edit all system prompts
- Version history tracking
- Reset to defaults
- Preview changes

**4. Timeline Tracking**
- Complete audit log
- User attribution
- Category tracking
- Source documentation

**5. Integration**
- Complaint analysis uses KB
- Letter generation cites KB
- Precedent matching enhanced
- Search across all content

---

## 🎉 You're Ready!

Everything is deployed and ready to use. The Knowledge Base system is now the **foundation** of Lightpoint's AI capabilities:

- **Complaints** pull from KB for analysis
- **Letters** cite KB for authority
- **Chat** queries KB for answers
- **Precedents** link to KB articles

Upload your CHG documents and watch the system come to life! 🚀

