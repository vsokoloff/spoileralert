# 🎯 EASY SETUP - No PostgreSQL Required!

Good news! I've updated the code to work with **SQLite** (no installation needed) for the MVP.

## Quick Start (No Database Installation!)

### Step 1: Set Up Backend

```bash
cd "/Users/vica/Spoiler Alert /backend"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (SQLite - no database setup needed!)
cat > .env << 'EOF'
# Leave DATABASE_URL empty to use SQLite (default)
# Or use: DATABASE_URL=sqlite:///./spoiler_alert.db
SECRET_KEY=your-secret-key-change-this
ENVIRONMENT=development
OPENAI_API_KEY=your-key-here-optional
EOF

# Initialize database (creates spoiler_alert.db file automatically)
python init_db.py

# Start server
python run.py
```

✅ **That's it!** No PostgreSQL installation needed. The database file `spoiler_alert.db` will be created automatically in the backend folder.

### Step 2: Set Up Frontend (New Terminal)

```bash
cd "/Users/vica/Spoiler Alert /frontend"
npm install
npm run dev
```

### Step 3: Open the App!

Go to: **http://localhost:3000**

---

## What Changed?

- ✅ Now uses **SQLite** by default (no installation needed)
- ✅ Database file created automatically: `backend/spoiler_alert.db`
- ✅ Works exactly the same as PostgreSQL for MVP
- ✅ Can switch to PostgreSQL later if needed

## Switch to PostgreSQL Later?

If you want to use PostgreSQL later, just:

1. Install PostgreSQL (see `INSTALL_POSTGRES.md`)
2. Create database: `createdb spoiler_alert`
3. Update `.env`: `DATABASE_URL=postgresql://localhost:5432/spoiler_alert`
4. Run: `python init_db.py`

That's it! The code supports both databases automatically.

---

## Troubleshooting

### "No module named 'app'"
Make sure you're in the backend directory and virtual environment is activated:
```bash
cd backend
source venv/bin/activate
```

### Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill
```

---

## You're Ready! 🚀

No database installation needed. Just follow the steps above and you're good to go!
