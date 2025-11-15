# Knowledge Base Upload System - Complete Guide

## Overview

The Knowledge Base Upload System allows you to upload HMRC guidance documents (CHG, GOV.UK, etc.) and automatically compare them against existing knowledge using AI. This ensures your knowledge base stays current without duplicates or conflicts.

---

## 🚀 Quick Start

### 1. **Access the Upload Portal**
- Navigate to **Dashboard → Knowledge Base**
- Click the **"Upload & Compare"** tab

### 2. **Upload Documents**
- Click the upload zone or drag files
- Supported formats: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), CSV, TXT
- Select multiple files (e.g., all 64 CHG documents)

### 3. **Review AI Comparison**
- System processes each document (shows progress)
- AI compares against existing knowledge base
- Get detailed reports for each document showing:
  - **Duplicates** (exact or near-exact matches)
  - **Overlaps** (partial matches with existing content)
  - **New Information** (novel content to add)
  - **Gaps Filled** (missing info in existing docs)
  - **Conflicts** (contradictions with existing knowledge)

### 4. **Approve or Reject**
- Review each comparison report
- Click **"Approve & Add"** to add to knowledge base
- Click **"Reject"** to skip the document
- Each approval is versioned and tracked

---

## 📊 How It Works

### Stage 1: Document Processing
```
File Upload → Text Extraction → Chunking → Storage Upload
```

**What happens:**
- File is uploaded to Supabase Storage
- Text is extracted (pdf-parse for PDF, mammoth for Word, xlsx for Excel)
- Content is chunked into smaller pieces for better analysis
- Metadata (filename, size, type) is recorded

**Supported Formats:**
- **PDF**: Standard text PDFs (scanned PDFs need OCR first)
- **Word**: .doc and .docx files
- **Excel**: .xls and .xlsx files
- **CSV**: Comma-separated values
- **TXT**: Plain text files

### Stage 2: AI Comparison
```
Document Embedding → Vector Search → Similarity Analysis → AI Reasoning
```

**What the AI checks:**
1. **Duplicate Detection** (>85% similarity)
   - Exact duplicates
   - Same content, different formatting
   - Updated versions of existing docs

2. **Overlap Analysis** (50-85% similarity)
   - Partial content matches
   - Sections that appear in multiple docs
   - Related but distinct information

3. **New Information Detection**
   - Novel topics not in existing knowledge base
   - New guidance or policy changes
   - Additional details on existing topics

4. **Gap Analysis**
   - Missing information in existing docs
   - Incomplete sections that this doc fills
   - Cross-references that were previously missing

5. **Conflict Detection**
   - Contradictory information
   - Different interpretations
   - Updated guidance that supersedes old info

### Stage 3: AI Recommendation
```
Analysis Results → Action Recommendation → Confidence Score → Reason
```

**AI Action Types:**
- **ADD**: Novel content that should be added (green badge)
- **MERGE**: Should be merged with existing entry (blue badge)
- **SKIP**: Duplicate or unnecessary (gray badge)
- **REPLACE**: Should replace outdated content (orange badge)
- **REVIEW**: Conflicts or ambiguity detected (yellow badge)

**Confidence Scores:**
- 90-100%: High confidence, safe to approve
- 70-89%: Medium confidence, review recommended
- Below 70%: Low confidence, careful review needed

---

## 🎨 UI Components

### Upload Zone
- Drag-and-drop area for file selection
- Shows file type icons and sizes
- Remove individual files before uploading
- Disabled during processing

### Processing Indicator
- Real-time progress bar
- Shows current document being processed
- "X of Y: filename.pdf"

### Comparison Results
Each document gets a detailed card showing:

**Header:**
- Document filename
- Action recommendation badge (ADD/MERGE/SKIP/etc.)
- Confidence percentage
- Approve/Reject buttons

**Sections:**
- **AI Recommendation**: Overall suggestion with reasoning
- **Duplicates Found**: List of existing docs that are very similar
- **Overlaps Detected**: Partial matches with overlap percentages
- **New Information**: Novel topics/content (up to 3 shown)
- **Gaps Filled**: Missing info this doc provides
- **Conflicts Detected**: Contradictions with existing knowledge

**Color Coding:**
- 🟢 Green: New information, gaps filled
- 🔵 Blue: Overlaps, merge suggestions
- 🟡 Yellow: Review needed
- 🟠 Orange: Conflicts, replacements
- 🔴 Red: Duplicates

---

## 🔄 Workflow Example: Uploading CHG Documents

Let's walk through uploading the 64 CHG (Complaint Handling Guidance) documents:

### Step 1: Select All CHG Files
```
Click "Upload" → Select all 64 .pdf files → Click "Open"
```

You'll see a list of 64 files with their sizes.

### Step 2: Start Upload
```
Click "Upload & Compare Against Existing Knowledge"
```

**Progress indicators will show:**
- "Processing Documents... 1 of 64: CHG-Section-1.pdf"
- "Processing Documents... 2 of 64: CHG-Section-2.pdf"
- ... and so on

This may take 5-10 minutes for 64 documents.

### Step 3: Review First Document
```
CHG-Section-1.pdf
📊 Action: ADD (95% confidence)
```

**AI Recommendation:**
"This document contains new information about HMRC complaint procedures that isn't in the current knowledge base. Recommend adding."

**New Information:**
- Topic: "Initial Complaint Submission"
- Topic: "28-Day Response Deadline"
- Topic: "Tier 1 Complaint Officer Role"

**Approve**: Click green button to add to knowledge base

### Step 4: Review Potential Duplicate
```
CHG-Section-5.pdf
📊 Action: SKIP (92% confidence)
```

**AI Recommendation:**
"This document appears to be a duplicate of 'HMRC Complaint Process Overview' already in the knowledge base."

**Duplicates Found:**
- "HMRC Complaint Process Overview" (89% similar)
- Reason: "Content is nearly identical, only formatting differs"

**Reject**: Click red button to skip

### Step 5: Review Conflict
```
CHG-Updated-2025.pdf
📊 Action: REPLACE (88% confidence)
```

**AI Recommendation:**
"This document contains updated guidance that supersedes 'CHG-2024-Version'."

**Conflicts Detected:**
- Conflict Type: "Updated Policy"
- Description: "New 28-day deadline vs. old 30-day deadline"
- Severity: High

**Approve**: This will add the new doc and flag the old one for review

### Step 6: Bulk Approvals
After reviewing the first 5-10 documents, you'll get a sense of the AI's accuracy. For subsequent documents with high confidence (>90%) and clear "ADD" recommendations, you can approve more quickly.

**Final Result:**
- 45 documents approved and added
- 12 documents rejected as duplicates
- 5 documents flagged for manual review (conflicts)
- 2 documents marked to replace old versions

---

## 📈 Monitoring & Timeline

### Browse Knowledge Tab
After approving documents, go to **"Browse Knowledge"** to see:
- All knowledge base entries
- Search functionality
- Categories and sources
- View/Delete individual entries

### Update Timeline Tab
See a chronological log of all changes:
- "CHG-Section-1.pdf added to Complaint Procedures"
- "CHG-Section-5.pdf updated in Escalation Process"
- Timestamp and user who made the change
- Source (manual upload, RSS feed, etc.)

### Usage in Complaints
Once documents are approved:
- They're instantly searchable in vector search
- Used in complaint analysis and letter generation
- Cited in AI responses in Knowledge Base Chat
- Available for precedent matching

---

## 🔧 Technical Details

### Document Processing
```typescript
// lib/kbDocumentProcessor.ts
processMultipleDocuments(files, orgId, onProgress)
  → Extract text from each file
  → Chunk into searchable pieces
  → Upload to Supabase storage
  → Return processed data
```

### AI Comparison
```typescript
// lib/knowledgeComparison.ts (tRPC)
uploadForComparison.mutate({
  filename, content, storagePath, fileType, fileSize
})
  → Generate embedding for document
  → Search for similar existing docs (vector search)
  → AI analyzes similarities/differences (Claude Sonnet 4.5)
  → Return structured comparison report
```

### Approval & Storage
```typescript
// tRPC: knowledge.approveStaged
approveStaged.mutate({ stagedId })
  → Move from knowledge_base_staging to knowledge_base
  → Log update to knowledge_base_updates
  → Invalidate queries to refresh UI
```

---

## 🛡️ Best Practices

### 1. Upload in Batches
- For large sets (like 64 CHG docs), consider uploading 10-20 at a time
- Allows you to review and approve incrementally
- Easier to catch errors or unexpected results

### 2. Review High-Confidence First
- Start with 95-100% confidence documents
- These are usually safe to approve quickly
- Builds understanding of AI's decision-making

### 3. Investigate Conflicts Carefully
- When AI detects conflicts, read both the new doc and existing doc
- Determine if the new doc supersedes the old one
- If unsure, approve and flag for later review

### 4. Check Suggested Categories
- AI suggests categories for new docs
- Verify they make sense with your taxonomy
- Adjust manually if needed (future feature)

### 5. Monitor Timeline
- Regularly check the Update Timeline
- Ensures proper versioning and attribution
- Catch any accidental uploads or approvals

### 6. Use Duplicates to Clean Up
- When AI finds duplicates, it's an opportunity to consolidate
- Delete older, less complete versions
- Keep the most comprehensive, up-to-date version

---

## 🐛 Troubleshooting

### "Failed to extract text"
**Cause**: Scanned PDF or unsupported format
**Solution**: 
- Use OCR tool to convert scanned PDFs to searchable PDFs
- Or convert to images and use complaint OCR feature

### "Processing takes too long"
**Cause**: Large files or many files
**Solution**: 
- Upload in smaller batches (10-20 files)
- Ensure files aren't unnecessarily large (compress if possible)
- Check Railway logs for errors

### "AI gives low confidence on obvious duplicates"
**Cause**: Different formatting or structure
**Solution**: 
- AI is being cautious
- If you're certain it's a duplicate, manually reject
- Future: Train AI on your approved/rejected decisions

### "Can't see uploaded documents in Browse tab"
**Cause**: Document is in staging, not approved
**Solution**: 
- Go back to Upload tab
- You may still see pending comparison results
- Approve documents to move them to knowledge base

---

## 🔮 Coming Next

### RSS Feed Integration (Next Phase)
- Automatically monitor HMRC/GOV.UK RSS feeds
- New documents auto-uploaded and compared
- Email notifications for admin approval
- Scheduled daily/weekly checks

### Advanced Features
- **Batch approve**: Select multiple high-confidence docs and approve all
- **Custom categories**: Edit AI-suggested categories before approval
- **Version control**: Track document revisions over time
- **Rollback**: Revert to previous version if needed
- **Merge tool**: Manually merge overlapping documents
- **Conflict resolution**: Side-by-side comparison for conflicts

---

## ✅ Ready to Use!

The system is now fully functional and ready for your 64 CHG documents. Here's the checklist:

- [x] Document processing (PDF, Word, Excel, CSV, TXT)
- [x] AI-powered comparison engine (Claude Sonnet 4.5)
- [x] Rich comparison UI with approve/reject
- [x] Staging and approval workflow
- [x] Timeline tracking and versioning
- [x] Integration with complaint analysis
- [x] Knowledge Base Chat access to new docs

**Next Steps:**
1. Run the 3 SQL scripts in Supabase (if not done yet)
2. Upload your 64 CHG documents
3. Review and approve the comparison results
4. Test Knowledge Base Chat with CHG-specific questions

You're all set! 🚀

