# How to Save Practice Settings Properly

## Issue
Your practice settings (firm name, address, £275 charge-out rate) are not persisting because they're stored in **browser localStorage**, which can be cleared.

## Solution: Save Your Settings

### Step 1: Go to Practice Settings
1. Navigate to `/settings` in your browser
2. OR click "Settings" in the navigation menu

### Step 2: Fill In ALL Required Fields

**Firm Details:**
- Firm Name: `RPGCC LLP` (or your full firm name)
- Address Line 1: `45 Victoria Street` (your actual address)
- Address Line 2: `Westminster` (optional)
- City: `London`
- Postcode: `SW1H 0EU`

**Contact Details:**
- Phone: `020 7946 0832` (your firm phone)
- Email: `complaints@rpgcc.co.uk` (or your complaints email)

**Professional Fees:**
- Charge-Out Rate: `275` (£275/hour, not £185)

### Step 3: Click "Save Settings" Button
**CRITICAL**: You MUST click the green "Save Settings" button at the bottom!

You should see a success message: ✅ "Settings saved successfully!"

### Step 4: Verify It Saved
1. Check the "Preview" box at the bottom - it should show your firm details
2. Refresh the page
3. Your settings should still be there
4. Check browser console - you should see: `✅ Practice settings saved`

---

## Why Settings Might Not Persist

### localStorage Can Be Cleared By:
1. **Browser clearing cache/cookies** - Settings lost
2. **Incognito/Private mode** - Settings not saved
3. **Different browser** - Each browser has separate storage
4. **Hard refresh (Cmd+Shift+R)** - Can clear localStorage

### Solutions:
1. **Always use the same browser** for Lightpoint
2. **Don't use incognito mode**
3. **Don't clear browser cache** without re-saving settings
4. **Save settings again after clearing cache**

---

## How to Check If Settings Are Saved

### Method 1: Browser Console
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Type: `localStorage.getItem('lightpoint_practice_settings')`
4. Press Enter
5. You should see a JSON string with your settings

### Method 2: Application Tab
1. Open browser DevTools (F12)
2. Go to "Application" tab (or "Storage" in Firefox)
3. Expand "Local Storage" in the left sidebar
4. Click on your site URL
5. Look for key: `lightpoint_practice_settings`
6. Check the value - it should contain your firm details

---

## What Happens If Not Saved

When practice settings are NOT in localStorage:

**Letter will use fallback/generic details:**
```
Professional Accountancy Services Ltd
45 Victoria Street
Westminster
London SW1H 0EU
Tel: 020 7946 0832
Email: complaints@professional-accounting.co.uk
Charge-out Rate: £185/hour (default)
```

**After saving your settings, letters will use:**
```
RPGCC LLP
45 Victoria Street
Westminster
London SW1H 0EU
Tel: 020 7946 0832
Email: complaints@rpgcc.co.uk
Charge-out Rate: £275/hour (your rate)
```

---

## Future Improvement

**TODO**: Move settings from localStorage to database
- Currently: Stored in browser only
- Future: Store in Supabase database
- Benefits:
  - Settings persist across browsers
  - Settings survive cache clearing
  - Organization-wide settings
  - Backup and restore capability

For now, make sure to:
1. Save settings in each browser you use
2. Re-save after clearing cache
3. Keep a backup of your settings

---

## Quick Test

After saving settings, try this:
1. Generate a letter
2. Check the letterhead at the top
3. Should say "RPGCC LLP" (your firm)
4. Check charge-out rate in letter
5. Should say "£275 per hour" (your rate)

If it still shows generic details, settings didn't save. Try again!

