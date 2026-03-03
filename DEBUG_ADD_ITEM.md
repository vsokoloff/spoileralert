# 🐛 Debug: Can't Add Items

## Quick Checks

### 1. Open Browser Console
- Press **F12** (or Cmd+Option+I)
- Go to **Console** tab
- Try to add an item
- **Copy any red error messages**

### 2. Check Backend Terminal
Look at the terminal where `python run.py` is running.

**When you try to add an item, do you see:**
- ✅ `POST /api/items` with status 200 → Good!
- ❌ Error messages → Share them

### 3. Test Backend Directly

Open browser console (F12) and run:

```javascript
fetch('http://localhost:8000/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test Milk",
    expiration_date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    quantity: 1,
    category: "Eggs & Dairy",
    location: "fridge",
    consumed: false
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**What does it return?**

## Common Issues

### Issue 1: "Validation Error"
**Symptom:** Backend returns 422 error

**Possible causes:**
- Category name doesn't match enum (must be exact: "Produce", "Deli", "Eggs & Dairy", etc.)
- Location must be lowercase: "fridge", "freezer", "pantry"
- Date format incorrect

**Fix:** I've updated the code to handle dates better. Try again!

### Issue 2: "Database Error"
**Symptom:** Backend returns 500 error

**Fix:**
```bash
cd backend
python init_db.py
```

### Issue 3: "CORS Error"
**Symptom:** Browser console shows CORS error

**Fix:** Make sure backend is running and CORS is enabled in `app/main.py`

### Issue 4: Silent Failure
**Symptom:** No error, but item doesn't appear

**Check:**
- Refresh the page after adding
- Check if item appears in the list
- Check browser console for any warnings

## What to Share

If still not working, share:
1. **Browser console errors** (F12 → Console)
2. **Backend terminal output** when you try to add
3. **Network tab** showing the POST request to `/api/items`
4. **What happens** when you click "Add Item" (does it submit? show error? nothing?)
