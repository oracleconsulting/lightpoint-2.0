# User Details in Letters - Fix Summary

## Problem
Generated complaint letters were showing generic placeholders instead of real user and practice information:

```
❌ **Professional Accountancy Services Ltd**
❌ [Name]
❌ [Title]
❌ [Firm Name]
❌ Chartered Accountants
```

## Solution
Letters now use real data from:
1. **User Context** (`useUser()`) - name, job title, email, phone
2. **Practice Settings** (localStorage) - firm name, address, charge-out rate

```
✅ RPGCC LLP
✅ 45 Victoria Street
✅ Westminster
✅ London SW1H 0EU
✅ Tel: 020 7946 0832
✅ Email: complaints@professional-accounting.co.uk

...

✅ Yours faithfully,

✅ James Howard
✅ Director
✅ RPGCC LLP
✅ Chartered Accountants
✅ Email: jhoward@rpgcc.co.uk
✅ Tel: 020 7946 0832
```

## Technical Implementation

### 1. Frontend Changes (`app/complaints/[id]/page.tsx`)
```typescript
import { useUser } from '@/contexts/UserContext';

const { currentUser } = useUser();

generateLetter.mutate({
  complaintId: params.id,
  analysis: analysisData.analysis,
  practiceLetterhead,
  chargeOutRate: practiceSettings?.chargeOutRate,
  userName: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Professional',
  userTitle: currentUser?.job_title || 'Chartered Accountant',
  userEmail: currentUser?.email,
  userPhone: currentUser?.phone,
});
```

### 2. Backend Changes (`lib/trpc/router.ts`)
```typescript
.input(z.object({
  complaintId: z.string(),
  analysis: z.any(),
  practiceLetterhead: z.string().optional(),
  chargeOutRate: z.number().optional(),
  userName: z.string().optional(),      // NEW
  userTitle: z.string().optional(),     // NEW
  userEmail: z.string().optional(),     // NEW
  userPhone: z.string().optional(),     // NEW
  useThreeStage: z.boolean().optional(),
}))
```

### 3. Three-Stage Pipeline (`lib/openrouter/three-stage-client.ts`)

**Function Signature:**
```typescript
export const generateComplaintLetterThreeStage = async (
  complaintAnalysis: any,
  clientReference: string,
  hmrcDepartment: string,
  practiceLetterhead?: string,
  chargeOutRate?: number,
  userName?: string,          // NEW
  userTitle?: string,         // NEW
  userEmail?: string,         // NEW
  userPhone?: string          // NEW
)
```

**Stage 2 (Structure) - Template:**
```
**12. CLOSING** ← Section heading MUST be bold

We trust HMRC will treat this matter with the appropriate urgency.

Yours faithfully,

${userName || '[Name]'}
${userTitle || '[Title]'}
${practiceLetterhead ? practiceLetterhead.split('\n')[0] : '[Firm Name]'}
Chartered Accountants
${userEmail ? `Email: ${userEmail}` : ''}
${userPhone ? `Tel: ${userPhone}` : ''}
```

**Stage 2 & 3 - Validation Rules:**
```
11. **Real User Details**: 
    ALWAYS use the provided real user name (${userName || 'NOT PROVIDED'}), 
    title (${userTitle || 'NOT PROVIDED'}), 
    email (${userEmail || 'NOT PROVIDED'}), 
    and phone (${userPhone || 'NOT PROVIDED'}) in the closing. 
    NEVER use placeholders like [Name], [Title], etc.

CRITICAL: If you use "[Name]" or "[Title]" instead of the REAL user 
details provided (${userName}, ${userTitle}), you have FAILED the task.
```

## Data Flow

1. **User logs in** → User profile loaded from `lightpoint_users` table
2. **UserContext stores** → `currentUser` with `full_name`, `job_title`, `email`, `phone`
3. **Practice settings stored** → localStorage with firm details and charge-out rate
4. **User clicks "Generate Letter"** → Both user data and practice data passed to backend
5. **Stage 1 (Facts)** → Extracts all facts (no user data needed yet)
6. **Stage 2 (Structure)** → Inserts real user details into letter template
7. **Stage 3 (Tone)** → Preserves real user details, adds professional tone
8. **Result** → Fully populated, authentic professional letter

## Fallbacks & Edge Cases

| Field | Source | Fallback |
|-------|--------|----------|
| `userName` | `currentUser.full_name` | Email prefix → 'Professional' |
| `userTitle` | `currentUser.job_title` | 'Chartered Accountant' |
| `userEmail` | `currentUser.email` | Omitted (not shown) |
| `userPhone` | `currentUser.phone` | Omitted (not shown) |
| `practiceLetterhead` | localStorage settings | '[Firm Name]' |
| `chargeOutRate` | localStorage settings | £185/hour |

## Testing Checklist

- [x] User with full profile → All fields populated
- [x] User with partial profile → Fallbacks used gracefully
- [x] No practice settings → Generic firm name used
- [x] Email/phone missing → Lines omitted (not shown as placeholders)
- [x] Stage 2 prompt → Uses real data in template
- [x] Stage 3 prompt → Preserves real data from Stage 2
- [x] Console logs → Show user details in Stage 2 and 3
- [x] Final letter → No placeholders, looks professional

## Why This Matters

### Before: Generic & Obvious
```
Yours faithfully,

[Name]
[Title]
[Firm Name]
Chartered Accountants
```
👎 **Looks auto-generated**  
👎 **No credibility**  
👎 **HMRC will dismiss it**

### After: Professional & Authentic
```
Yours faithfully,

James Howard
Director
RPGCC LLP
Chartered Accountants
Email: jhoward@rpgcc.co.uk
Tel: 020 7946 0832
```
👍 **Looks real**  
👍 **Professional credibility**  
👍 **HMRC takes it seriously**

## Related Files
- `app/complaints/[id]/page.tsx` - Frontend user data extraction
- `lib/trpc/router.ts` - Backend API schema
- `lib/openrouter/three-stage-client.ts` - Letter generation pipeline
- `contexts/UserContext.tsx` - User profile management
- `app/settings/page.tsx` - Practice settings UI

## Future Enhancements
1. ✅ Real user details (DONE)
2. ⏳ Custom letterhead templates (per-firm branding)
3. ⏳ User signature images
4. ⏳ Multiple practice addresses (branch offices)
5. ⏳ Role-specific titles (Partner, Manager, Senior Associate)

---

**Committed:** Saturday, November 15, 2025  
**Author:** AI Assistant  
**Commit:** `188efc4` - "FIX: Use real user details in generated letters"

