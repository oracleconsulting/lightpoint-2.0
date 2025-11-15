# CHG Documents Status & Knowledge Base Integration

## Quick Answer
**YES** - The CHG documents should be in the knowledge base and being used during analysis, BUT you need to verify they uploaded successfully.

---

## How It Works (Current System)

### 1. Knowledge Base Search During Analysis ✅

When you click "Analyze Complaint", the system:

1. **Multi-Angle Search** (12 different search queries)
   - Generates variations based on complaint context
   - Examples: "complaint escalation tier 1 tier 2 adjudicator", "CRG professional fees", etc.
   - Searches ALL documents in `knowledge_base` table

2. **Vector Search** (Semantic Understanding)
   - Generates embeddings for each search query
   - Finds similar documents using cosine similarity
   - Gets 30 candidates per query (3x final count for reranking)

3. **Reranking with Cohere** ✅
   - Takes all 174+ candidates from multi-angle search
   - Reranks using Cohere Rerank 3.5 API
   - Returns top 10 most relevant documents
   - **This ensures CHG docs are prioritized if relevant**

4. **No Separation** - CHG and Charter docs are in ONE database
   - All documents are in the same `knowledge_base` table
   - All get embedded with the same model (text-embedding-ada-002)
   - All searchable together
   - Reranker treats all equally

---

## How to Verify CHG Documents Are In The System

### Step 1: Run the SQL Check

I've created `CHECK_CHG_DOCUMENTS.sql` - run it in Supabase SQL Editor.

**Expected Results if CHG is uploaded:**
- Query 1: Shows 60+ CHG-related documents
- Query 2: Shows 'CHG' category with document count
- Query 4: ALL documents have embeddings (no missing)
- Query 5: Shows actual CHG content previews

**If NO Results:**
- CHG documents were NOT successfully uploaded
- They may be in `knowledge_base_staging` (pending approval)
- Or upload failed entirely

### Step 2: Check Recent Uploads

```sql
SELECT title, category, created_at, LENGTH(content)
FROM knowledge_base
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

Should show all your recent CHG uploads if they went through.

---

## Why CHG Might Not Be Referenced in Letters

### Possible Reasons:

1. **CHG Not Uploaded** ❌
   - Documents never made it to `knowledge_base` table
   - Stuck in staging or failed during upload

2. **CHG Not Relevant to This Complaint** ✅ (Most Likely)
   - Reranker determined Charter/CRG docs were more relevant
   - CHG is about HMRC internal procedures
   - Your complaint is about delays/communication (Charter violations)
   - Letter correctly prioritized Charter over CHG

3. **Embedding/Search Issue** ❌ (Unlikely)
   - CHG documents missing embeddings
   - Search not finding them despite relevance

---

## What Gets Used in Your Letter

Looking at your generated letter, it referenced:

**Charter Violations:**
- "Being Responsive" - Charter commitment
- "Getting Things Right" - Charter commitment  
- "Making Things Easy" - Charter commitment

**CRG References:**
- CRG4025 - Unreasonable Delay
- CRG6050 - Communication Standards
- CRG5225 - Professional Costs
- CRG3250 - Poor Communication

**NO CHG References** - This is EXPECTED because:
- CHG is about how HMRC staff should handle complaints
- Your letter is complaining ABOUT the handling
- Charter + CRG are more appropriate for the complaint type
- Reranker correctly prioritized Charter/CRG over CHG

---

## When CHG WOULD Be Used

CHG documents would be prioritized if:

1. **Challenging HMRC's complaint response**
   - "Your tier 1 response violated CHG408..."
   - "You failed to follow CHG502 escalation procedures..."

2. **Escalation to Adjudicator**
   - "Per CHG guidelines, you must respond within 15 days..."
   - "CHG requires you to..."

3. **Procedural failures in complaint handling**
   - "You didn't acknowledge my complaint per CHG..."

Your current complaint is about the ORIGINAL issue (DT form delay), not about how HMRC handled your complaint. So CHG isn't the right reference.

---

## The Reranking is Working Properly ✅

From your logs:
```
📦 Multi-angle search found 174 candidates
🎯 Cohere reranking 174 documents...
✅ Reranked to top 10 results
```

This means:
- System found 174 potentially relevant documents (includes CHG, Charter, CRG, precedents)
- Cohere Rerank 3.5 analyzed ALL 174
- Selected the TOP 10 most relevant
- Those 10 were used in the letter

**The reranker is doing its job** - selecting the BEST documents for THIS complaint type.

---

## How to Test CHG Integration

### Test 1: Create a CHG-Relevant Complaint

Upload a complaint that's ABOUT complaint handling:

**Context:**
```
HMRC responded to our tier 1 complaint but failed to address all points.
They did not acknowledge receipt within the required timeframe.
We want to escalate to tier 2 following proper CHG procedures.
```

This should trigger CHG document retrieval because it's about complaint procedures.

### Test 2: Check Logs

When you analyze, check Railway logs for:
```
🔍 Starting multi-angle knowledge base search with reranking...
📊 Generated 12 search angles: [...]
📦 Multi-angle search found 174 candidates
```

The system IS searching everything. Reranker chooses what's most relevant.

---

## Summary

### ✅ What's Working:
1. Multi-angle search (12 query variations)
2. Vector search (semantic similarity)
3. Cohere reranking (precision filtering)
4. All documents in ONE knowledge base
5. CHG, Charter, CRG all equally searchable

### ⚠️ What to Verify:
1. **Run `CHECK_CHG_DOCUMENTS.sql`** to confirm CHG is in database
2. Check document count and embeddings
3. Verify CHG content is actually there

### 💡 Expected Behavior:
- **Charter/CRG for original issues** (delays, errors, communication)
- **CHG for complaint handling issues** (escalation, procedures, responses)
- Your letter used Charter/CRG correctly for the complaint type

---

## Next Steps

1. **Run the SQL check** - Verify CHG documents exist
2. **If CHG missing** - Re-upload via Knowledge Base admin
3. **If CHG present** - System is working correctly, just not relevant for this complaint
4. **Test with CHG-relevant complaint** - See if CHG gets used

The reranking system is smart - it's choosing the RIGHT references for each complaint type. Charter/CRG for service failures, CHG for procedural issues.

Let me know what the SQL query shows! 🔍

