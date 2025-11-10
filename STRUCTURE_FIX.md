# Letter Structure Fix - Restoring Target Quality

## The Problem

The current output had regressed from the **target RPGCC LLP letter** quality. Here's what was wrong:

### Issue 1: Markdown Headings Instead of Bold

**❌ CURRENT (WRONG):**
```
## The Catalogue of Failures

February 2024: We submit a straightforward SEIS relief claim...
```

**✅ TARGET (CORRECT):**
```
**TIMELINE OF FAILURES**

**February 2024:** Initial SEIS relief claim submitted with full supporting documentation...
```

**Fix:** Changed prompt from "adapt to situation" to explicit "use bold (**HEADING:**) not markdown (##)"

---

### Issue 2: Vague Timeline Entries

**❌ CURRENT (WRONG):**
```
Post-8 April 2025: Multiple chase attempts following our submission. Each promised callback never materialized.
```

**✅ TARGET (CORRECT):**
```
**8-25 April 2025:** Four separate attempts to obtain clarification on why HMRC has contradicted its own instructions. Each promised callback never materialised. Each written chase ignored.
```

**Fix:** Added explicit requirement for "**[Specific Date Range]:**" format with exact counts ("Four separate attempts" not "Multiple")

---

### Issue 3: Unprofessional Sarcasm

**❌ CURRENT (WRONG):**
```
I await your response with interest, though based on current performance, limited optimism.
```

**✅ TARGET (CORRECT):**
```
I expect your response to address each failure specifically, not generic apologies. My client has waited 14 months for £34,000+ of legitimate tax relief. Every additional day of delay compounds your liability for costs and compensation.
```

**Fix:** Added to "Avoid" list: "Sarcasm or excessive editorializing ('limited optimism', etc.)"

---

### Issue 4: Charter Violations Not Structured

**❌ CURRENT (WRONG):**
```
## The Impact of Your Failures

This 14-month delay comprehensively breaches CRG4025's standard that complaints should be triggered at 8 weeks...

Your Charter commitment to "Being Responsive" has been shattered...
```

**✅ TARGET (CORRECT):**
```
**CHARTER & COMPLAINTS REFORM VIOLATIONS**

Your handling violates multiple Charter commitments and CRG standards:

**1. CRG4025 - Unreasonable Delays (Critical Breach)**

A 14-month delay for a standard relief claim that should take 30 days represents a 1,400% excess over reasonable timescales. This isn't a delay - it's an abandonment of basic administrative function. The Adjudicator routinely upholds complaints with far shorter delays.

**2. Charter - Being Responsive (Severe Breach)**

Nine months of silence (February-November 2024) followed by claims of correspondence that cannot be produced...
```

**Fix:** Added explicit structure: "Format each as: **[Number]. [CRG/Charter] - [Type] ([Severity])**"

---

### Issue 5: Professional Costs Not Itemized

**❌ CURRENT (WRONG):**
```
At our standard rate of £275 per hour, the professional fees directly attributable to your failures now exceed £2,000 - costs that would never have been incurred had you processed this claim within your own 30-day standard.
```

**✅ TARGET (CORRECT):**
```
**IMPACT & COSTS**

The financial impact extends beyond the £34,000+ relief my client cannot access:

- **Professional time wasted:** 11.5 hours at £275/hour = £3,162.50

  - Initial claim preparation: 2 hours
  - Chasing February-November silence: 3 hours  
  - Investigating phantom November letter: 2.5 hours
  - SEIS3 preparation per your instruction: 1.5 hours
  - Resolving contradictory tax return issue: 1.5 hours
  - Preparing this complaint: 1 hour

- **Client distress:** Substantial worry from 14-month deprivation of significant tax relief

- **Public purse:** Your inefficiency wastes taxpayer resources through repeated unnecessary work

These costs continue mounting daily due to your failures.
```

**Fix:** Added explicit structure with breakdown format and bullet points

---

### Issue 6: Generic Enclosures

**❌ CURRENT (WRONG):**
```
Enclosures: Complete timeline of submissions and correspondence attempts
```

**✅ TARGET (CORRECT):**
```
**Enclosed:**

- February 2024 SEIS claim submission confirmation
- Timeline of unanswered correspondence February-November 2024
- March 2025 HMRC letter instructing SEIS3 completion
- 8 April 2025 SEIS3 submission confirmation
- 15 April 2025 contradictory tax return received
- Record of four unanswered chase attempts April 2025
```

**Fix:** Added requirement for "specific documents (not 'complete timeline')" with bullet list

---

## The Solution: Prescriptive Structure WITH Authentic Tone

The key insight: **Claude needs clear structure guidance while maintaining authentic voice.**

### New Prompt Structure (Section 6):

```
6. **Structure** (follow this format):
   
   **LETTERHEAD SECTION:**
   - Practice details (from letterhead or generate realistic)
   - Date (after all timeline events)
   - HMRC address
   - Subject line format: **FORMAL COMPLAINT - [BRIEF SUMMARY]**
   - Client Reference line: **Client Reference: [REF]**
   - Category line: **Complaint Category: [CATEGORIES]**
   
   **OPENING PARAGRAPH:**
   - Lead with the core failure in one sentence
   - Second sentence: Personal authority + scale ("20 years of practice")
   - Third sentence: Impact ("deprived of £X since...")
   - Fourth sentence: Memorable phrase ("would be comedic if...")
   
   **TIMELINE OF FAILURES:**
   - Section heading: **TIMELINE OF FAILURES**
   - Each entry: **[Month Year]:** Description
   - Use specific dates, not ranges
   - Build frustration chronologically
   - Include specific counts: "Four separate attempts", "Nine months"
   - End entries with impact: "Each promised callback never materialised"
   
   [... continues with all sections ...]
```

### Enhanced "Avoid" List (Section 7):

```
7. **Avoid**:
   - Generic complaints that could be anyone's
   - Markdown headings (##) - use bold (**HEADING:**) instead
   - Sarcasm or excessive editorializing ("limited optimism", etc.)
   - Vague timeline entries ("Post-8 April" instead of "**8-25 April 2025:**")
   - Generic enclosures ("complete timeline" instead of specific documents)
   - Legal jargon that obscures meaning
   - Apologetic or tentative language
   - Phrases like "we respectfully request"
```

### Good vs Bad Examples (Section 9):

```
9. **CRITICAL: Follow this exact formatting example**:

GOOD Timeline Entry:
**February 2024:** Initial SEIS relief claim submitted with full supporting 
documentation. Standard processing time for such claims is 30 days per your 
own guidance.

BAD Timeline Entry:
"## February 2024" (markdown heading - wrong!)
"Post-8 April 2025: Multiple chase attempts" (vague - wrong!)

[... continues with more examples ...]
```

---

## Key Changes Made

### 1. Structure Clarity
- **Before:** "adapt to situation, don't force"
- **After:** Explicit section-by-section template with exact formatting

### 2. Format Specificity
- **Before:** General guidance
- **After:** Exact format for dates, headings, bullets

### 3. Content Precision
- **Before:** "be specific"
- **After:** "Four separate attempts" not "Multiple attempts"

### 4. Tone Balance
- **Before:** Risk of sarcasm creeping in
- **After:** Professional fury without editorializing

### 5. Examples Added
- **Before:** No examples
- **After:** Good vs Bad for every critical section

---

## Expected Result

The next letter generated should **exactly match** the RPGCC LLP target structure:

✅ Bold headings (`**TIMELINE OF FAILURES**`)  
✅ Specific date entries (`**8-25 April 2025:**`)  
✅ Numbered Charter violations (`**1. CRG4025 - Unreasonable Delays (Critical Breach)**`)  
✅ Itemized professional costs with breakdown  
✅ Specific enclosures list (6 items)  
✅ Professional, powerful closing (no sarcasm)  
✅ Specific counts ("Four separate attempts")  
✅ Memorable phrases naturally integrated  

---

## The Balance Achieved

This fix achieves the "Goldilocks" balance:

**Too Loose (Previous):**
- "Adapt to situation, don't force"
- Result: Markdown headings, vague entries, sarcasm

**Too Prescriptive (Earlier Attempt):**
- "MUST include 6-10 timeline entries"
- "Use phrases like 'phantom letter'"
- Result: Robotic, checklist-style

**Just Right (Now):**
- Clear structure template (format)
- Authentic tone guidance (principles)
- Good vs Bad examples (clarity)
- Result: Professional, structured, authentic fury

---

## Testing the Fix

### Checklist for Next Generated Letter:

**Structure:**
- [ ] Uses bold (`**HEADING:**`) not markdown (`##`)
- [ ] Has all required sections in order
- [ ] Timeline entries use `**[Date]:**` format
- [ ] Charter violations numbered and structured
- [ ] Professional costs itemized with breakdown
- [ ] Enclosures list 4-6 specific documents

**Content:**
- [ ] Specific counts ("Four attempts" not "Multiple")
- [ ] Specific dates ("**8-25 April 2025:**" not "Post-8 April")
- [ ] Memorable phrases ("phantom letter", "would be comedic")
- [ ] Personal authority ("20 years of practice")
- [ ] Power phrases ("This isn't a delay - it's an abandonment")

**Tone:**
- [ ] Professional but genuinely furious
- [ ] No sarcasm or editorializing
- [ ] Strong but not apologetic
- [ ] Demands, not requests
- [ ] Credible escalation warning

**Formatting (when rendered):**
- [ ] Headings appear bold
- [ ] Proper line spacing
- [ ] Bullet points for costs and enclosures
- [ ] Numbered list for resolution demands
- [ ] Professional serif display (Georgia)

---

## Files Changed

**`lib/openrouter/client.ts`** (lines 207-336):
- Section 6: Expanded from 10 lines to 74 lines with detailed structure
- Section 7: Enhanced "Avoid" list with specific formatting issues
- Section 9: NEW - Good vs Bad examples for all critical sections

**Total prompt length:** ~330 lines (up from ~240 lines)

**Why this length is justified:**
- Claude Opus has 200K context window
- Prompt is ~3,000 tokens
- Analysis data is ~50K tokens
- Room for 4K token letter generation
- Better to be explicit than ambiguous

---

## Commit History

**`1c05273` - FIX: Restore exact target letter structure**

Summary of changes:
- Prescriptive structure template (Section 6)
- Enhanced avoid list for formatting (Section 7)  
- Good vs Bad examples (Section 9)
- Maintains authentic tone while enforcing structure

---

## Next Steps

1. **Test letter generation** with existing complaint
2. **Compare output** to RPGCC LLP target
3. **Verify structure** matches exactly
4. **Confirm tone** is professional fury (not sarcasm)
5. **Check formatting** when rendered in FormattedLetter component

---

**End of Document**

*Last Updated: November 10, 2025*
*Commit: 1c05273*

