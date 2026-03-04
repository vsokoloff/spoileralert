# 🚀 Common Commands Reference

Quick reference for common commands you'll need.

## Frontend Commands

**Always run these from the `frontend/` directory:**

```bash
cd "/Users/vica/Spoiler Alert /frontend"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Backend Commands

**Always run these from the `backend/` directory:**

```bash
cd "/Users/vica/Spoiler Alert /backend"

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start server
python run.py
```

## Git Commands

**Run from the root directory:**

```bash
cd "/Users/vica/Spoiler Alert "

# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main
```

## Quick Start (Both Servers)

**Terminal 1 - Backend:**
```bash
cd "/Users/vica/Spoiler Alert /backend"
source venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/vica/Spoiler Alert /frontend"
npm run dev
```

## Common Mistakes

❌ **Running npm in root directory**
- Error: `Could not read package.json`
- Fix: `cd frontend` first

❌ **Running python without virtual environment**
- Error: `Module not found`
- Fix: `source venv/bin/activate` first

❌ **Running backend without database**
- Error: `Database connection failed`
- Fix: `python init_db.py` first
