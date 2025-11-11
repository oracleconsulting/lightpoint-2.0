# ⏱️ LIGHTPOINT TIME TRACKING & BILLING SYSTEM

## 📋 Overview

Lightpoint automatically tracks billable time for all complaint-related activities. Time is logged in the background and displayed in real-time on the complaint detail page.

---

## 💰 **Standard Billing Rates**

### **Automatic Time Allocations**

| Activity | Duration | Calculation | Billable Value @ £250/hr |
|----------|----------|-------------|-------------------------|
| **Initial Analysis** | 30-60 min | 30 min + (10 min × document count) | £125 - £250 |
| **Letter Generation** | 20 min | Fixed | £83.33 |
| **Response Review** | 20-40 min | Based on complexity | £83.33 - £166.67 |
| **Follow-up Letter** | 20 min | Fixed | £83.33 |
| **Re-analysis** | 15-30 min | With additional context | £62.50 - £125 |

### **Example Billing Scenarios**

#### **Simple Complaint (1 document)**
```
Initial Analysis:     40 min  →  £166.67
Letter Generation:    20 min  →  £83.33
═══════════════════════════════════════
TOTAL:                60 min  →  £250.00
```

#### **Standard Complaint (3 documents)**
```
Initial Analysis:     60 min  →  £250.00
Letter Generation:    20 min  →  £83.33
Response Review:      30 min  →  £125.00
Follow-up Letter:     20 min  →  £83.33
═══════════════════════════════════════
TOTAL:              2h 10min  →  £541.66
```

#### **Complex Complaint (5 documents + escalation)**
```
Initial Analysis:     90 min  →  £375.00
Letter Generation:    20 min  →  £83.33
Response Review 1:    40 min  →  £166.67
Follow-up Letter 1:   20 min  →  £83.33
Response Review 2:    30 min  →  £125.00
Follow-up Letter 2:   20 min  →  £83.33
Escalation Analysis:  20 min  →  £83.33
═══════════════════════════════════════
TOTAL:              4h 00min  →  £1,000.00
```

---

## 🔧 **Setup Instructions**

### **Step 1: Run Database Setup**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/SETUP_TIME_TRACKING.sql`
5. Click **Run**

The script will:
- ✅ Create `time_logs` table
- ✅ Set up indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create appropriate policies
- ✅ Verify successful creation

### **Step 2: Set Your Practice Rate**

1. Go to the Lightpoint dashboard
2. Click **Practice Settings**
3. Enter your charge-out rate (default: £250/hr)
4. Save settings

This rate is stored in browser local storage and used for all value calculations.

### **Step 3: Verify Time Tracking**

1. Create or open a complaint
2. Upload documents and analyze
3. Generate a letter
4. Check the **Time & Value** card

You should see:
- ✅ Activity entries appearing
- ✅ Total time calculated
- ✅ Total value at your rate

---

## 📊 **How It Works**

### **Automated Tracking**

Time is automatically logged when you:

1. **Analyze a Complaint**
   - Triggered: When you click "Analyze Complaint"
   - Duration: 30 min + (10 min × number of documents)
   - Maximum: 60 minutes
   - Logged as: "Initial Analysis"

2. **Generate a Letter**
   - Triggered: When letter generation completes successfully
   - Duration: 20 minutes (fixed)
   - Logged as: "Letter Generation"

3. **Review HMRC Response**
   - Triggered: When you upload an HMRC response
   - Duration: 20-40 minutes (based on complexity)
   - Logged as: "Response Review"

4. **Generate Follow-up Letter**
   - Triggered: When follow-up is prepared
   - Duration: 20 minutes (fixed)
   - Logged as: "Follow-up Letter Preparation"

5. **Re-analyze with Context**
   - Triggered: When you add context and re-analyze
   - Duration: 15-30 minutes
   - Logged as: "Re-analysis"

### **Time Log Structure**

Each time entry includes:
```typescript
{
  id: uuid,
  complaint_id: uuid,
  activity_type: string,
  minutes_spent: integer,
  automated: boolean,
  created_at: timestamp
}
```

---

## 🎨 **UI Display**

### **Time & Value Card**

Located in the left sidebar of complaint detail pages:

```
┌─────────────────────────────────────────┐
│ Time & Value                    £541.66 │
├─────────────────────────────────────────┤
│ Total Time: 2h 10min                    │
│ Charge Rate: £250/hr                    │
├─────────────────────────────────────────┤
│ Activity Log                            │
│                                         │
│ 🔍 Initial Analysis      60m   £250.00 │
│ 📝 Letter Generation     20m   £83.33  │
│ 📧 Response Review       30m   £125.00 │
│ 📝 Follow-up Letter      20m   £83.33  │
└─────────────────────────────────────────┘
```

### **Activity Icons**

- 🔍 **Analysis** - Initial complaint analysis
- 📝 **Letter** - Letter generation
- 📧 **Response** - Response review
- 🔄 **Re-analysis** - Additional context analysis
- ⚠️ **Escalation** - Escalation activities

---

## 💡 **Customization**

### **Adjusting Time Allocations**

To change the default time allocations, edit these values in the code:

**File:** `app/complaints/[id]/page.tsx`

```typescript
// Initial Analysis (lines 58-59)
const estimatedMinutes = Math.min(30 + (docCount * 10), 60);
// Change: Base 30 min, +10 per doc, max 60 min

// Letter Generation (line 92)
duration: 20,
// Change: Fixed 20 minutes

// Response Review (in ResponseUploader.tsx)
duration: 30,
// Change: Fixed 30 minutes

// Follow-up Letter (in FollowUpManager.tsx)
duration: 20,
// Change: Fixed 20 minutes
```

### **Multiple Charge Rates**

If you want different rates for different activities:

1. Add activity-specific rates to practice settings
2. Modify the `logTime.mutate()` calls to include `rate: specificRate`
3. Update TimeTracker to display per-activity rates

---

## 📈 **Reporting & Export**

### **Current Capabilities**

- ✅ Real-time time tracking
- ✅ Total time calculation per complaint
- ✅ Total value calculation at practice rate
- ✅ Activity breakdown with timestamps
- ✅ Scrollable activity log

### **Future Enhancements**

- 📊 Export to CSV/Excel
- 📄 Invoice generation
- 📅 Date range filtering
- 👥 Multi-user time tracking
- 🏢 Organization-wide reporting
- 💼 Client billing statements

---

## 🔍 **Verification Queries**

### **Check All Time Logs**

```sql
SELECT 
  tl.id,
  c.complaint_reference,
  tl.activity_type,
  tl.minutes_spent,
  tl.created_at
FROM time_logs tl
JOIN complaints c ON c.id = tl.complaint_id
ORDER BY tl.created_at DESC;
```

### **Summary by Complaint**

```sql
SELECT 
  c.complaint_reference,
  COUNT(tl.id) as activities,
  SUM(tl.minutes_spent) as total_minutes,
  ROUND(SUM(tl.minutes_spent)::numeric / 60, 2) as total_hours,
  ROUND(SUM(tl.minutes_spent)::numeric / 60 * 250, 2) as value_at_250
FROM complaints c
LEFT JOIN time_logs tl ON tl.complaint_id = c.id
GROUP BY c.id, c.complaint_reference
ORDER BY total_minutes DESC;
```

### **Time Logs by Date Range**

```sql
SELECT 
  DATE(tl.created_at) as date,
  COUNT(tl.id) as activities,
  SUM(tl.minutes_spent) as total_minutes,
  ROUND(SUM(tl.minutes_spent)::numeric / 60 * 250, 2) as value
FROM time_logs tl
WHERE tl.created_at >= '2025-01-01'
  AND tl.created_at < '2025-02-01'
GROUP BY DATE(tl.created_at)
ORDER BY date;
```

---

## 🛠️ **Troubleshooting**

### **Issue: "0m" showing in Time & Value**

**Possible Causes:**
1. ❌ `time_logs` table doesn't exist
2. ❌ RLS policies blocking access
3. ❌ Time logging mutation failing silently

**Solutions:**

**1. Check if table exists:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'time_logs'
);
```

**2. Run setup script:**
- Execute `supabase/SETUP_TIME_TRACKING.sql`

**3. Check browser console:**
- Open DevTools → Console
- Look for "Time logging error" messages
- Check Network tab for failed requests

**4. Verify RLS policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'time_logs';
```

### **Issue: Time not logging for new activities**

**Check:**
1. Practice settings saved? (Check local storage)
2. Console errors? (Open DevTools)
3. Mutation completing? (Check Network tab)

**Force Retry:**
1. Refresh the page
2. Re-run the activity (analyze, generate letter, etc.)
3. Check console for errors

---

## 🎯 **Best Practices**

### **For Maximum Accuracy**

1. ✅ **Set accurate practice rate** - Update in Practice Settings
2. ✅ **Review time allocations** - Adjust defaults if needed
3. ✅ **Monitor activity log** - Verify entries are appearing
4. ✅ **Export regularly** - Keep records for invoicing
5. ✅ **Document adjustments** - Note any manual time additions

### **For Professional Invoicing**

1. **Total Time**: Round to nearest 6 minutes (0.1 hour)
2. **Activity Descriptions**: Use clear, client-friendly language
3. **Value Display**: Always show currency symbol (£)
4. **Date Range**: Group by week or month
5. **Export**: Generate PDF or Excel for client

---

## 📝 **Example Invoice Format**

```
LIGHTPOINT HMRC COMPLAINT SERVICES
Invoice for: Complaint REF-2025-001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date       Activity                 Time    Value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11/11/25   Initial Analysis         1.0h    £250.00
11/11/25   Letter Generation        0.3h    £83.33
12/11/25   Response Review          0.5h    £125.00
12/11/25   Follow-up Letter         0.3h    £83.33
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL                               2.1h    £541.66
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Professional Rate: £250/hour
All time automatically tracked and logged
```

---

## 🚀 **Summary**

✅ **Automatic Tracking** - No manual entry needed
✅ **Real-time Display** - See value accumulate
✅ **Accurate Billing** - Industry-standard allocations
✅ **Professional Output** - Ready for client invoicing
✅ **Scalable** - Works for simple to complex complaints

**Next Steps:**
1. Run `SETUP_TIME_TRACKING.sql` in Supabase
2. Set your practice rate
3. Create/analyze a complaint
4. Watch the time tracking work! 🎉

