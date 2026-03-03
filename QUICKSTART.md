# Quick Start Guide - Spoiler Alert MVP

Get the MVP running in 10 minutes!

## Prerequisites Check

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Google Cloud account (for Vision API - optional for testing)
- [ ] OpenAI API key (optional for testing)

## Step 1: Database Setup (2 min)

```bash
# Create database
createdb spoiler_alert

# Or using psql:
psql -U postgres
CREATE DATABASE spoiler_alert;
\q
```

## Step 2: Backend Setup (3 min)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/spoiler_alert
OPENAI_API_KEY=your_key_here
SECRET_KEY=your_secret_key_here
ENVIRONMENT=development
EOF

# Initialize database
python3 init_db.py

# Start server
python3 run.py
```

Backend should be running on http://localhost:8000

## Step 3: Frontend Setup (2 min)

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend should be running on http://localhost:3000

## Step 4: Test It Out!

1. Open http://localhost:3000
2. Click "Add First Item" or use the bottom nav
3. Add an item manually or try scanning a receipt
4. Check out SPOY for recipe suggestions!

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL in `.env`
- Verify database exists: `psql -l | grep spoiler_alert`

### Port Already in Use
- Backend: Change port in `run.py` or use `uvicorn app.main:app --port 8001`
- Frontend: Vite will auto-suggest another port

### API Errors
- Make sure backend is running first
- Check CORS settings in `backend/app/main.py`
- Verify API URL in frontend `.env` if using custom port

### Missing Dependencies
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

## Next Steps

- Add your Google Vision API credentials for receipt scanning
- Add your OpenAI API key for SPOY chatbot
- Customize colors and styling
- Add more food items to expiration database

## Need Help?

Check the main README.md for detailed documentation.
