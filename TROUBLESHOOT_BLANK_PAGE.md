# 🔍 Troubleshooting: Blank Page on localhost:3000

## Quick Checks

### 1. Open Browser Developer Console
- Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Look at the **Console** tab for red errors
- Look at the **Network** tab to see if API calls are failing

### 2. Check What You See
- **Completely blank white page?** → JavaScript error
- **Dark/black page with nothing?** → CSS might be working, but content not loading
- **"Loading..." text?** → API connection issue

### 3. Test Backend Connection
Open in browser: http://localhost:8000/api/health

Should return: `{"status":"healthy"}`

If this doesn't work, backend isn't running properly.

## Common Issues & Fixes

### Issue 1: API Connection Failed
**Symptom:** Console shows CORS errors or "Failed to fetch"

**Fix:**
```bash
# Make sure backend is running
cd backend
source venv/bin/activate
python run.py
```

### Issue 2: JavaScript Errors
**Symptom:** Red errors in browser console

**Common errors:**
- `Cannot find module` → Frontend dependencies not installed
- `Network Error` → Backend not running or CORS issue

**Fix:**
```bash
cd frontend
npm install
npm run dev
```

### Issue 3: Dark Background (Everything is Black)
**Symptom:** Page loads but you can't see anything (dark theme)

**This is normal!** The app uses a dark theme. Try:
- Look for white/grey text
- Check if you can see the bottom navigation bar
- Try clicking around - buttons might be there but hard to see

### Issue 4: Database Not Initialized
**Symptom:** API returns 500 errors

**Fix:**
```bash
cd backend
python init_db.py
```

## Quick Test

1. **Open browser console** (F12)
2. **Go to Network tab**
3. **Refresh page** (Cmd+R / Ctrl+R)
4. **Look for failed requests** (red)
5. **Check Console tab** for errors

## Still Not Working?

Share the error messages from the browser console!
