# How to See Server-Side Logs

## The Problem
Server-side logs (from API routes) appear in the **terminal where `npm run dev` is running**, NOT in the browser console.

## Solution

### Step 1: Find the Dev Server Terminal
1. **In Cursor/VS Code**: Look for a terminal tab that shows:
   ```
   > lightpoint-complaint-system@2.0.0 dev
   > next dev -p 3005
   ```
   
2. **If you don't see it**: The dev server might be running in a different terminal window or tab.

### Step 2: Start/Restart the Dev Server
If the dev server isn't running or you can't find it:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
npm run dev
```

This will start the server on **port 3005** and show logs in that terminal.

### Step 3: Watch for Diagnostic Logs
When you click "Generate Layout", you should see logs like:

```
🔴🔴🔴 V2 ROUTE CALLED 🔴🔴🔴
🔴 [API] Content type: string
🔴 [API] Content (first 500 chars): ...
🔴 [normalizeContent] Input type: string
🔴 [normalizeContent] Has HTML tags: false
🔴 [normalizeContent] Content is already plain text, skipping HTML processing
```

### Step 4: Check Browser Console Too
- **Browser console** (F12) shows **client-side** logs (from React components)
- **Server terminal** shows **server-side** logs (from API routes)

Both are important for debugging!

## Quick Check
Run this to see if the server is running:
```bash
lsof -ti:3005
```

If it returns a number, the server is running. If it returns nothing, start it with `npm run dev`.

