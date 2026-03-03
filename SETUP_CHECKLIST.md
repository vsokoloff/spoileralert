# Setup Checklist for Spoiler Alert MVP

Use this checklist to ensure everything is set up correctly.

## Pre-Setup

- [ ] Python 3.9+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed and running (`pg_isready`)
- [ ] Git installed (optional, for version control)

## Backend Setup

- [ ] Navigate to `backend/` directory
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create `.env` file from `.env.example`
- [ ] Set `DATABASE_URL` in `.env`
- [ ] Set `OPENAI_API_KEY` in `.env` (optional for MVP)
- [ ] Set `SECRET_KEY` in `.env`
- [ ] Create PostgreSQL database: `createdb spoiler_alert`
- [ ] Initialize database: `python init_db.py`
- [ ] Start backend: `python run.py`
- [ ] Verify backend running: Visit `http://localhost:8000/api/health`

## Frontend Setup

- [ ] Navigate to `frontend/` directory
- [ ] Install dependencies: `npm install`
- [ ] Create `.env` file (optional): `VITE_API_URL=http://localhost:8000`
- [ ] Start frontend: `npm run dev`
- [ ] Verify frontend running: Visit `http://localhost:3000`

## API Keys (Optional for Testing)

- [ ] Google Cloud account created
- [ ] Google Vision API enabled
- [ ] Service account key downloaded
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` set in `.env`
- [ ] OpenAI API key obtained
- [ ] `OPENAI_API_KEY` set in `.env`

## Testing

- [ ] Backend health check works
- [ ] Can create an item via API
- [ ] Frontend loads without errors
- [ ] Can add item manually
- [ ] Can view items in fridge
- [ ] Categories display correctly
- [ ] SPOY chatbot responds (if API key set)
- [ ] Receipt scanning works (if Google Vision configured)

## Common Issues

### Database Connection Failed
- Check PostgreSQL is running
- Verify DATABASE_URL format: `postgresql://user:password@host:port/dbname`
- Check database exists: `psql -l`

### Module Not Found (Python)
- Activate virtual environment
- Reinstall: `pip install -r requirements.txt`

### Module Not Found (Node)
- Delete `node_modules` and `package-lock.json`
- Run: `npm install`

### CORS Errors
- Check backend CORS settings in `app/main.py`
- Verify frontend API URL matches backend URL

### Port Already in Use
- Kill process on port 8000: `lsof -ti:8000 | xargs kill`
- Or change port in `run.py`

## Ready for Development!

Once all items are checked, you're ready to start developing!
