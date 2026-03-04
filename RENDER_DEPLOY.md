# 🚀 Deploying to Render

## Backend Deployment (Python FastAPI)

### Render Web Service Settings

**Name:** `spoiler-alert-backend` (or your choice)

**Language:** Python 3

**Branch:** `main` (or your default branch)

**Region:** Oregon (US West) - or your preferred region

**Root Directory:** `backend`

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python run.py
```
OR
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Instance Type:** 
- **Free** for testing (has limitations)
- **Starter ($7/month)** recommended for production

### Environment Variables

Add these in Render's Environment Variables section:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
# OR for SQLite (not recommended for production):
# DATABASE_URL=sqlite:///./spoiler_alert.db

SECRET_KEY=your-secret-key-change-this
# Add any other secret tokens for authentication, third-party APIs, etc. here as needed.
# Example: JWT_SECRET=your-jwt-secret-key
ENVIRONMENT=production
OPENAI_API_KEY=your-openai-api-key
GOOGLE_APPLICATION_CREDENTIALS=/opt/render/project/src/google-credentials.json
```

### PostgreSQL Database Setup

1. **Create PostgreSQL Database on Render:**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `spoiler-alert-db`
   - Region: Same as your web service
   - Plan: Free (for testing) or Starter ($7/month)

2. **Get Database URL:**
   - Copy the "Internal Database URL" from Render
   - Use it as `DATABASE_URL` in environment variables

3. **Initialize Database:**
   - After first deploy, you may need to run migrations
   - Or add to build command: `python init_db.py`

### Updated Start Command (Recommended)

Use this start command for better Render compatibility:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Update `backend/run.py` to use PORT environment variable:

```python
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
```

## Frontend Deployment (Vercel - Recommended)

### Option 1: Vercel (Easiest for React)

1. Go to https://vercel.com
2. Import your GitHub repository
3. Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### Option 2: Render (Frontend)

If deploying frontend on Render too:

**Name:** `spoiler-alert-frontend`

**Language:** Node

**Root Directory:** `frontend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run preview
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Quick Deploy Checklist

### Backend (Render)
- [ ] Create PostgreSQL database
- [ ] Create Web Service (Python 3)
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add environment variables (DATABASE_URL, SECRET_KEY, etc.)
- [ ] Deploy!

### Frontend (Vercel - Recommended)
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm run build`
- [ ] Set Output Directory: `dist`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy!

## After Deployment

1. **Update CORS in backend:**
   - Add your frontend URL to allowed origins in `backend/app/main.py`

2. **Test the API:**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"healthy"}`

3. **Update frontend API URL:**
   - Set `VITE_API_URL` to your Render backend URL

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify PORT environment variable is used
- Check database connection

### Database connection fails
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Run `python init_db.py` manually if needed

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify VITE_API_URL is set correctly
- Check backend URL is accessible
