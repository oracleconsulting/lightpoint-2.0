# Lightpoint Tables to Extract from OracleConsulting Database

## Identified Lightpoint Tables (22 tables)

### Core Complaint Management
1. `complaints` - Main complaint records
2. `complaint_assignments` - User-complaint assignments
3. `documents` - Uploaded complaint documents (might be shared?)
4. `generated_letters` - AI-generated complaint letters
5. `time_logs` - Billable time tracking
6. `management_tickets` - Internal flags/issues
7. `ticket_comments` - Comments on tickets

### Knowledge Base System
8. `knowledge_base` - HMRC guidance documents
9. `knowledge_base_staging` - Documents awaiting approval
10. `knowledge_base_updates` - Change history
11. `knowledge_base_comparison_cache` - AI comparison cache
12. `precedents` - Historical complaint templates
13. `rss_feeds` - RSS feed configurations (Lightpoint-specific?)
14. `rss_feed_items` - RSS feed items (Lightpoint-specific?)

### AI & Chat
15. `kb_chat_conversations` - Knowledge base chat sessions
16. `kb_chat_messages` - Chat message history
17. `kb_chat_feedback` - User feedback on chat
18. `ai_prompts` - System prompts (might be shared?)
19. `ai_prompt_history` - Prompt version history (might be shared?)
20. `ai_prompt_tests` - Prompt testing (might be shared?)

### Users & Organizations
21. `lightpoint_users` - Lightpoint user profiles
22. `organizations` - Organization records (might be shared?)

## Potentially Shared Tables (Need Clarification)

These might be used by other OracleConsulting projects:
- `documents` - Could be shared document system?
- `organizations` - Could be shared across projects?
- `ai_prompts`, `ai_prompt_history`, `ai_prompt_tests` - Shared AI infrastructure?
- `rss_feeds`, `rss_feed_items` - Are these Lightpoint-specific?

## Export Strategy

### Option A: Export All Lightpoint Tables
Export all 22 tables identified above

### Option B: Export Core + Lightpoint-Specific Only
Export only tables with "complaint", "lightpoint", "kb_chat", "knowledge_base", "precedent" in the name

### Option C: Let me check table contents
I can query a few rows from uncertain tables to confirm if they're Lightpoint-specific

## Recommended Approach

**I recommend Option C first:**
Let me check a few tables to confirm they're Lightpoint-specific:
- Check `documents` table for complaint-related docs
- Check `organizations` for Lightpoint org IDs
- Check `ai_prompts` for Lightpoint-specific prompts

**Then proceed with targeted export.**

---

## What Should I Do?

**Tell me:**
1. **"Export all 22 tables"** - Safe approach, get everything
2. **"Check tables first"** - Let me verify which are Lightpoint-specific
3. **"Export core only"** - Just complaint/knowledge_base/precedents tables

Which approach do you prefer? 🎯

