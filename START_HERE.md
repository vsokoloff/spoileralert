# 🚀 START HERE - How to Run Your MVP

Follow these steps in order to get your Spoiler Alert MVP running!

## 📋 Step-by-Step Instructions

### Step 1: Check Prerequisites

Open your terminal and check if you have everything:

```bash
# Check Python (need 3.9+)
python --version
# or
python3 --version

# Check Node.js (need 18+)
node --version

# Check PostgreSQL
psql --version
```

**If anything is missing:**
- Python: Download from python.org
- Node.js: Download from nodejs.org
- PostgreSQL: Download from postgresql.org or use Homebrew: `brew install postgresql`

---

### Step 2: Create the Database

**🎉 GOOD NEWS: No database installation needed!**

The MVP now uses **SQLite** by default (no PostgreSQL required). The database will be created automatically when you run the setup.

**If you want to use PostgreSQL instead:**
- See `INSTALL_POSTGRES.md` for installation instructions
- Or use SQLite (recommended for quick MVP setup - no installation needed!)

---

### Step 3: Set Up Backend

Open a terminal and run these commands:

```bash
# Navigate to backend folder
cd "/Users/vica/Spoiler Alert /backend"

# Create virtual environment
python3 -m venv venv

# Activate it (macOS/Linux)
source venv/bin/activate

# You should see (venv) in your terminal prompt now!

# Install all Python packages
pip install -r requirements.txt
```

**Create the .env file:**

```bash
# Create .env file (SQLite - no database setup needed!)
cat > .env << 'EOF'
# Leave DATABASE_URL empty to use SQLite (recommended for MVP)
# Or set: DATABASE_URL=sqlite:///./spoiler_alert.db
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=change-this-to-random-string
ENVIRONMENT=development
EOF
```

**Or manually create `.env` file in the backend folder with:**
```
# SQLite (default - no installation needed!)
# DATABASE_URL=sqlite:///./spoiler_alert.db

# Or use PostgreSQL (if installed):
# DATABASE_URL=postgresql://localhost:5432/spoiler_alert

OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=change-this-to-random-string
ENVIRONMENT=development
```

**Note:** If you don't set `DATABASE_URL`, it will automatically use SQLite (no setup needed!)

**Initialize the database:**
```bash
python init_db.py
```

**Start the backend server:**
```bash
python run.py
```

✅ **You should see:** `Uvicorn running on http://0.0.0.0:8000`

**Keep this terminal open!** The backend needs to keep running.

---

### Step 4: Set Up Frontend (New Terminal)

Open a **NEW terminal window** (keep backend running!) and run:

```bash
# Navigate to frontend folder
cd "/Users/vica/Spoiler Alert /frontend"

# Install all Node packages
npm install

# Start the frontend dev server
npm run dev
```

✅ **You should see:** `Local: http://localhost:3000`

---

### Step 5: Open the App!

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the "My Fridge" page!

---

## 🎯 Quick Test

1. Click **"Add First Item"** or the **+** button at bottom
2. Choose **"Manual Entry"**
3. Fill in:
   - Name: "Milk"
   - Category: "Eggs & Dairy"
   - Location: "Fridge"
   - Expiration Date: (pick a date)
4. Click **"Add Item"**
5. You should see it on the main page!

---

## ⚠️ Common Issues & Fixes

### "Database connection failed"
```bash
# Make sure PostgreSQL is running
pg_isready

# If not running, start it:
brew services start postgresql  # macOS
```

### "Port 8000 already in use"
```bash
# Find what's using it
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)

# Or change port in backend/run.py
```

### "Module not found" (Python)
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # You should see (venv) in prompt

# Reinstall packages
pip install -r requirements.txt
```

### "Module not found" (Node)
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Cannot find backend API"
- Make sure backend is running (Step 3)
- Check backend terminal shows it's running on port 8000
- Try: http://localhost:8000/api/health in browser (should return JSON)

---

## 🔑 API Keys (Optional - for full features)

### OpenAI API Key (for SPOY chatbot)
1. Go to: https://platform.openai.com/api-keys
2. Create new key
3. Add to `backend/.env`: `OPENAI_API_KEY=sk-...`

### Google Vision API (for receipt scanning)
1. Go to: https://console.cloud.google.com/
2. Create project
3. Enable Vision API
4. Create service account
5. Download JSON key
6. Add to `backend/.env`: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

**Note:** The app works without these! SPOY and receipt scanning just won't work until you add keys.

---

## 📱 What You Can Do Now

✅ View your fridge inventory  
✅ Add items manually  
✅ Edit items  
✅ Delete items (with undo!)  
✅ Filter by category  
✅ Search items  
✅ See color-coded expiration status  
✅ Get recipe suggestions from SPOY (if API key added)  
✅ Scan receipts (if Google Vision set up)  

---

## 🆘 Still Stuck?

1. Check the terminal for error messages
2. Make sure both backend AND frontend terminals are running
3. Check `QUICKSTART.md` for more details
4. Check `README.md` for full documentation

---

## ✨ You're Ready!

Your MVP is now running! Start adding items and testing features! 🎉
