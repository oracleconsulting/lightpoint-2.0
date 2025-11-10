# Three-Stage Letter Generation Pipeline

## The Problem with Single-Stage Generation

The single-stage approach was creating **overcomplicated prompts** trying to do everything at once:
- Extract facts
- Structure the letter
- Add professional tone
- Ensure formatting
- Maintain authenticity

Result: **350-line mega-prompt** that was hard to maintain and prone to inconsistency.

---

## The Solution: Three-Stage Pipeline

Separate **content**, **structure**, and **tone** into three focused stages.

### Stage 1: Fact Extraction (Sonnet 4.5 - 1M Context)

**Model:** `anthropic/claude-sonnet-4.5`  
**Temperature:** 0.2 (low for factual accuracy)  
**Context:** 1,000,000 tokens  
**Cost:** $3/M input tokens  

**Purpose:**  
Extract ALL relevant facts from the complaint analysis WITHOUT any tone or persuasive language.

**Output Format:**  
Structured fact sheet with clear sections:
- Timeline facts (exact dates, durations, gaps)
- Financial facts (amounts, hours, rates, calculations)
- Violation facts (specific CRG/Charter breaches)
- Communication facts (what was sent, when, by whom)
- System failure facts (contradictions, lost correspondence)
- Impact facts (client distress, wasted time)

**Example Output:**
```
TIMELINE FACTS:
- February 2024: SEIS relief claim submitted
- February - November 2024: 9 months of silence
- November 2024: HMRC claims letter sent (never received)
- March 2025: Instruction to complete SEIS3
- 8 April 2025: SEIS3 submitted
- 15 April 2025: Contradictory tax return issued
- 8-25 April 2025: 4 separate chase attempts, all ignored

FINANCIAL FACTS:
- Relief claim amount: £34,000+
- Standard processing time: 30 days
- Actual processing time: 14 months
- Delay excess: 1,400%
- Professional hours: 11.5 hours
- Charge-out rate: £275/hour
- Professional costs: £3,162.50
- Recommended distress payment: £400

VIOLATION FACTS:
- CRG4025: 14-month delay vs 30-day standard
- Charter "Being Responsive": 180 working days beyond 15-day promise
- CRG3250: Lost correspondence, system failure
- Charter "Getting Things Right": Contradictory instructions
- Charter "Making Things Easy": Complexity despite compliance
```

**Why Sonnet 4.5:**
- Can handle full complaint analysis (up to 1M tokens)
- Excellent at factual extraction
- 1/5th the cost of Opus for this task
- No need for creative language

---

### Stage 2: Structure (Opus 4.1 - Objective)

**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.3 (low for consistency)  
**Context:** 200,000 tokens  
**Cost:** $15/M input tokens  

**Purpose:**  
Organize facts into proper HMRC complaint letter structure WITHOUT emotional language.

**Input:** Stage 1 fact sheet  
**Output:** Fully structured letter with objective tone

**Template Applied:**
```
[LETTERHEAD]
[Date]
[HMRC Address]

**FORMAL COMPLAINT - [SUMMARY]**
**Client Reference: [REF]**
**Complaint Category: [CATEGORIES]**

Dear Sir/Madam,

[Opening paragraph - factual]

**TIMELINE OF FAILURES**
**[Date]:** [Description]
[Continue chronologically]

**CHARTER & COMPLAINTS REFORM VIOLATIONS**
**1. [CRG/Charter] - [Type] ([Severity])**
[Factual description]

**IMPACT & COSTS**
- **Professional time wasted:** [X] hours at £[Y]/hour = £[Z]
  - [Task]: [X] hours

**RESOLUTION REQUIRED**
1. **[Action]**

**ESCALATION WARNING**
[15-day deadline and escalation path]

**RESPONSE REQUIRED BY: [DATE]**
[Expectations]

Yours faithfully,
[Name/Title/Firm]

**Enclosed:**
- [Specific documents]
```

**Why Opus 4.1 for Structure:**
- Superior understanding of formal letter conventions
- Consistent application of template
- Better at organizing complex information
- Handles conditional logic (letterhead, rates)

**Example Output Tone (Objective):**
```
**February 2024:** SEIS relief claim submitted with full documentation. 
Standard processing time is 30 days.

**8-25 April 2025:** Four attempts made to obtain clarification regarding 
the contradictory instructions. No responses received to any of these attempts.
```

---

### Stage 3: Professional Fury (Opus 4.1 - Emotional)

**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.7 (high for creative language)  
**Context:** 200,000 tokens  
**Cost:** $15/M input tokens  

**Purpose:**  
Transform structured letter into powerful, authentic complaint WITH professional fury.

**Input:** Stage 2 structured letter (objective)  
**Output:** Final letter with authentic tone

**What Gets Added:**

1. **Opening Punch:**
```
BEFORE (Stage 2):
"I am writing to formally complain about the processing of my client's SEIS relief claim..."

AFTER (Stage 3):
"In twenty years of handling HMRC matters, I have rarely encountered such comprehensive 
failure of basic administrative competence. What should have been a straightforward SEIS 
relief claim has become a 14-month abandonment of your statutory obligations."
```

2. **Memorable Phrases:**
- "phantom letter" (lost correspondence)
- "would be comedic if the consequences weren't so serious"
- "The left hand has no idea what the right hand instructed"
- "This isn't a delay - it's an abandonment"

3. **Specific Frustration:**
```
BEFORE: "Multiple attempts made"
AFTER: "Four separate attempts to obtain clarification. Each promised callback never materialised."
```

4. **Personal Authority:**
- "In twenty years of practice..."
- "One of the most severe examples I have encountered..."
- "I have rarely seen such..."

5. **Power Calculations:**
```
BEFORE: "Significant delay beyond standard timeframe"
AFTER: "A 1,400% excess over reasonable timescales"
```

6. **Escalation Confidence:**
```
BEFORE: "I will escalate if necessary"
AFTER: "The Adjudicator routinely upholds complaints with far shorter delays. 
The evidence here is incontrovertible."
```

**Why Opus 4.1 for Tone:**
- Superior creative language generation
- Maintains professional boundary while adding fury
- Understands nuance of authentic vs robotic
- Better at memorable phrase creation

---

## Cost Comparison

### Single-Stage (Previous):
```
Opus 4.1 for everything:
- Analysis context: ~50K tokens @ $15/M = $0.75
- Generation: ~4K tokens @ $15/M = $0.06
Total: ~$0.81 per letter
```

### Three-Stage (New):
```
Stage 1 (Sonnet 4.5 - Facts):
- Input: ~50K tokens @ $3/M = $0.15
- Output: ~2K tokens @ $15/M = $0.03
Subtotal: $0.18

Stage 2 (Opus 4.1 - Structure):
- Input: ~2K tokens @ $15/M = $0.03
- Output: ~3K tokens @ $75/M = $0.225
Subtotal: $0.255

Stage 3 (Opus 4.1 - Tone):
- Input: ~3K tokens @ $15/M = $0.045
- Output: ~4K tokens @ $75/M = $0.30
Subtotal: $0.345

Total: ~$0.78 per letter (slightly cheaper!)
```

**Plus Benefits:**
- ✅ Cleaner separation of concerns
- ✅ Each prompt is simple and focused
- ✅ Easier to debug which stage is failing
- ✅ Can reuse Stage 1 facts for multiple purposes
- ✅ Can A/B test different tone approaches
- ✅ More consistent output

---

## Implementation

### File Structure:
```
lib/openrouter/
├── client.ts                  # Original single-stage (legacy)
├── three-stage-client.ts      # NEW: Three-stage pipeline
└── ...
```

### tRPC Integration:
```typescript
letters: router({
  generateComplaint: publicProcedure
    .input(z.object({
      complaintId: z.string(),
      analysis: z.any(),
      practiceLetterhead: z.string().optional(),
      chargeOutRate: z.number().optional(),
      useThreeStage: z.boolean().optional(), // Default: true
    }))
    .mutation(async ({ input }) => {
      const useThreeStage = input.useThreeStage !== false;
      
      if (useThreeStage) {
        // NEW: Three-stage pipeline
        letter = await generateComplaintLetterThreeStage(...);
      } else {
        // LEGACY: Single-stage
        letter = await generateComplaintLetter(...);
      }
      
      return { letter };
    }),
})
```

**Default:** Three-stage is enabled by default  
**Fallback:** Can use `useThreeStage: false` for legacy single-stage

---

## Testing Strategy

### Test Each Stage Independently:

**Stage 1 Test:**
```typescript
const factSheet = await stage1_extractFacts(analysis, ref, dept);
console.log('FACT SHEET:', factSheet);

// Should see: Objective bullet points, no tone
// ✅ "February 2024: Claim submitted"
// ❌ "would be comedic if..."
```

**Stage 2 Test:**
```typescript
const structured = await stage2_structureLetter(factSheet, letterhead, rate);
console.log('STRUCTURED LETTER:', structured);

// Should see: Proper structure, still objective
// ✅ "**TIMELINE OF FAILURES**"
// ✅ "**February 2024:** Claim submitted"
// ❌ "In twenty years of practice..."
```

**Stage 3 Test:**
```typescript
const final = await stage3_addTone(structured);
console.log('FINAL LETTER:', final);

// Should see: Same structure, powerful tone
// ✅ "**TIMELINE OF FAILURES**"
// ✅ "In twenty years of practice..."
// ✅ "phantom letter"
// ✅ "would be comedic if..."
```

---

## Advantages Over Single-Stage

### 1. Simplicity
- **Before:** 350-line mega-prompt trying to do everything
- **After:** Three focused prompts, each ~50 lines

### 2. Debuggability
- **Before:** "Letter is wrong" - which part?
- **After:** Can inspect output at each stage

### 3. Flexibility
- **Before:** Locked into one approach
- **After:** Can swap out Stage 3 for different tones

### 4. Reusability
- **Before:** Facts buried in letter generation
- **After:** Stage 1 facts can be used for summaries, dashboards, etc.

### 5. Maintainability
- **Before:** Change one thing, risk breaking everything
- **After:** Each stage is independent

---

## Potential Future Enhancements

### A/B Testing Tone:
```typescript
// Try different tone approaches
const conservative = await stage3_addTone(structured, 'conservative');
const aggressive = await stage3_addTone(structured, 'aggressive');

// Let user choose or use ML to predict best approach
```

### Multi-Use Facts:
```typescript
const facts = await stage1_extractFacts(analysis, ref, dept);

// Use for letter
const letter = await stage2_and_3(facts);

// Also use for dashboard
const summary = await generateSummary(facts);

// Also use for client email
const email = await generateClientEmail(facts);
```

### Partial Regeneration:
```typescript
// Don't like the tone? Keep structure, regenerate tone
const betterTone = await stage3_addTone(existingStructure);
```

---

## Migration Path

### Current Users:
- No action required
- Three-stage is now default
- Output quality should improve

### Testing Both:
```typescript
// Test three-stage
await generateLetter({ useThreeStage: true });

// Compare to legacy
await generateLetter({ useThreeStage: false });
```

### Rollback:
If issues arise, temporarily disable:
```typescript
// In router.ts, change default
const useThreeStage = input.useThreeStage !== false; // Currently true by default
// To:
const useThreeStage = input.useThreeStage === true; // Opt-in only
```

---

## Monitoring

### Log Output:
```
🚀 Using THREE-STAGE pipeline for letter generation
📊 STAGE 1: Extracting facts with Sonnet 4.5 (1M context)
✅ Stage 1 complete: Facts extracted
🏗️ STAGE 2: Structuring letter with Opus 4.1 (objective)
✅ Stage 2 complete: Letter structured
🔥 STAGE 3: Adding professional fury with Opus 4.1
✅ Stage 3 complete: Professional fury added
🎉 Three-stage pipeline complete!
```

### Performance Metrics:
- Stage 1 time: ~3-5 seconds (Sonnet is fast)
- Stage 2 time: ~5-8 seconds (Opus structuring)
- Stage 3 time: ~6-10 seconds (Opus creative)
- **Total: ~15-25 seconds** (acceptable for quality)

---

## Summary

**Problem:** Overcomplicated single prompt trying to do everything  
**Solution:** Three focused stages (facts → structure → tone)  
**Cost:** Similar (~$0.78 vs $0.81)  
**Benefits:** Simpler, debuggable, flexible, reusable  
**Migration:** Automatic (default enabled)  
**Fallback:** Legacy single-stage available  

---

**End of Document**

*Last Updated: November 10, 2025*
*Implementation: three-stage-client.ts*

