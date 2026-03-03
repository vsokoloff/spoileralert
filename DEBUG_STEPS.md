# 🐛 Debug Steps for Blank Page

## Step 1: Check Browser Console

1. Open http://localhost:3000
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click **Console** tab
4. Look for **red error messages**
5. **Copy and share** any errors you see

## Step 2: Check Network Requests

1. In browser dev tools, click **Network** tab
2. Refresh the page (Cmd+R / Ctrl+R)
3. Look for requests to `/api/items` or `/api/categories`
4. Click on them - do they show **200 OK** or **error**?

## Step 3: Test Backend Directly

Open in browser: **http://localhost:8000/api/health**

**Expected:** `{"status":"healthy"}`

**If you get an error:**
- Backend isn't running
- Go to backend terminal and restart: `python run.py`

## Step 4: Check Frontend Terminal

Look at the terminal where you ran `npm run dev`

**Do you see:**
- ✅ `Local: http://localhost:3000` → Good!
- ❌ Errors → Share the error message

## Step 5: Quick Visual Check

The app uses a **dark theme** (black background). You might see:
- Dark page with white text
- Bottom navigation bar at the bottom
- "My Fridge" header at top

**If you see ANY of these, the app IS loading!** It might just be empty (no items yet).

## Step 6: Try Adding an Item

1. Click the **+** button at bottom
2. Click **"Manual Entry"**
3. Try adding an item
4. Does it work?

## Common Issues

### "Failed to fetch" or CORS error
**Fix:** Make sure backend is running on port 8000

### "Cannot find module"
**Fix:** 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### White blank page
**Fix:** Check browser console for JavaScript errors

### Dark page but nothing visible
**This might be normal!** Try:
- Scroll down - content might be there
- Click around - buttons might work
- Add an item to see if it appears

## Still Stuck?

**Share:**
1. Screenshot of browser console (F12 → Console tab)
2. Screenshot of Network tab
3. What you see on the page (blank? dark? loading?)
4. Any error messages from terminal
