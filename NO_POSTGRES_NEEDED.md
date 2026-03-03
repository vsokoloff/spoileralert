# ✅ No PostgreSQL Needed!

I've updated your MVP to use **SQLite** by default - no database installation required!

## What Changed?

- ✅ Uses SQLite (built into Python - no installation!)
- ✅ Database file created automatically: `backend/spoiler_alert.db`
- ✅ Works exactly the same for MVP purposes
- ✅ Can switch to PostgreSQL anytime later

## Quick Start (No Database Setup!)

```bash
# 1. Backend setup
cd "/Users/vica/Spoiler Alert /backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Create .env (SQLite - no DATABASE_URL needed!)
cat > .env << 'EOF'
SECRET_KEY=your-secret-key
ENVIRONMENT=development
EOF

# 3. Initialize database (creates .db file automatically)
python init_db.py

# 4. Start backend
python run.py
```

```bash
# 5. Frontend (new terminal)
cd "/Users/vica/Spoiler Alert /frontend"
npm install
npm run dev
```

**That's it!** Open http://localhost:3000

---

## Want PostgreSQL Later?

If you want PostgreSQL later, just:
1. Install it (see `INSTALL_POSTGRES.md`)
2. Set `DATABASE_URL=postgresql://localhost:5432/spoiler_alert` in `.env`
3. Run `python init_db.py` again

The code automatically detects which database you're using!

---

## You're All Set! 🎉

No more "command not found: createdb" errors. Just follow the steps above!
