# 🔧 Fix Database Connection Error

The error shows it's trying to connect to PostgreSQL. Here's how to fix it:

## Quick Fix

The code should default to SQLite, but if you have a `.env` file with a PostgreSQL URL, it will try to use that.

**Solution:** Make sure your `.env` file either:
1. Doesn't exist (SQLite will be used automatically), OR
2. Has SQLite URL explicitly set

## Create/Update .env File

```bash
cd "/Users/vica/Spoiler Alert /backend"

# Create .env with SQLite (recommended for MVP)
cat > .env << 'EOF'
# Use SQLite - no database installation needed!
DATABASE_URL=sqlite:///./spoiler_alert.db
SECRET_KEY=your-secret-key-change-this
ENVIRONMENT=development
EOF
```

## Then Try Again

```bash
python init_db.py
```

This should work now! The database file `spoiler_alert.db` will be created in the backend folder.
