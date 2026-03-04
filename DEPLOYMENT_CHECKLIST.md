# 🚀 Render Deployment Readiness Checklist

## ✅ Backend Configuration

### Files Present:
- ✅ `backend/requirements.txt` - All dependencies listed
- ✅ `backend/runtime.txt` - Python 3.11.9 specified
- ✅ `backend/render.yaml` - Render configuration exists
- ✅ `backend/run.py` - Server startup script exists
- ✅ `backend/app/main.py` - FastAPI app configured with CORS
- ✅ `backend/app/database.py` - Supports both SQLite and PostgreSQL

### Configuration Status:

**✅ Database:**
- Code defaults to SQLite but will use PostgreSQL if `DATABASE_URL` is set
- Render database service will provide `DATABASE_URL` automatically
- Tables auto-create on startup (`Base.metadata.create_all`)

**✅ API Keys (Optional):**
- `OPENAI_API_KEY` - Optional (SPOY has fallback responses)
- `GOOGLE_APPLICATION_CREDENTIALS` - Optional (receipt scanning has mock fallback)
- Both routers handle missing keys gracefully

**✅ CORS:**
- Configured to accept `FRONTEND_URL` environment variable
- Localhost origins included for development

**⚠️ Potential Issues:**

1. **Pydantic Version**: `requirements.txt` has `pydantic==2.9.0` which should have pre-built wheels, but if build fails, consider pinning to `2.5.0` (which we know works)

2. **Database URL**: Make sure Render database service is created and linked to web service

3. **Environment Variables**: These need to be set in Render dashboard:
   - `DATABASE_URL` (auto-set if database service is linked)
   - `FRONTEND_URL` (your Vercel frontend URL)
   - `OPENAI_API_KEY` (optional, for AI features)
   - `SECRET_KEY` (for JWT/auth - can use Render's generateValue)
   - `ENVIRONMENT=production`

## 📋 Deployment Steps

### 1. Create Database Service (if not using render.yaml)
- Go to Render Dashboard → New → PostgreSQL
- Name: `spoileralert-db`
- Plan: Free (for MVP)
- Copy the Internal Database URL

### 2. Create Web Service
- Option A: Use `render.yaml` (infrastructure as code)
  - Go to Render Dashboard → New → Blueprint
  - Connect your GitHub repo
  - Render will read `render.yaml` and create services automatically

- Option B: Manual setup
  - Go to Render Dashboard → New → Web Service
  - Connect GitHub repo
  - Settings:
    - **Name**: `spoileralert-backend`
    - **Root Directory**: `backend`
    - **Environment**: Python 3
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    - **Instance Type**: Free (for MVP)

### 3. Set Environment Variables
In Render dashboard, add:
```
DATABASE_URL=<from database service>
FRONTEND_URL=https://your-frontend.vercel.app
SECRET_KEY=<generate or set your own>
ENVIRONMENT=production
OPENAI_API_KEY=<your-key-if-you-have-one>
```

### 4. Deploy
- Push to GitHub (main branch)
- Render will auto-deploy
- Check logs for any errors

## 🔍 Post-Deployment Verification

1. **Health Check**: Visit `https://your-backend.onrender.com/api/health`
   - Should return: `{"status": "healthy"}`

2. **Database**: Check Render logs for "Database tables created successfully"

3. **CORS**: Test API from frontend - should work if `FRONTEND_URL` is set correctly

## ⚠️ Known Limitations (Free Tier)

- **Cold Starts**: Free tier services spin down after 15min inactivity
- **Build Time**: Limited to 90 minutes
- **Database**: Free PostgreSQL has 90-day retention limit

## 🐛 Troubleshooting

**Build Fails with Rust Error:**
- Pin `pydantic==2.5.0` and `pydantic-settings==2.1.0` in requirements.txt

**Database Connection Error:**
- Verify `DATABASE_URL` is set correctly
- Check database service is running
- Ensure web service is linked to database service

**CORS Errors:**
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check frontend API client is pointing to correct backend URL

**API Returns 500:**
- Check Render logs for detailed error messages
- Verify all required environment variables are set

## ✅ Ready to Deploy?

**YES** - The backend is ready for Render deployment! 

The code has:
- ✅ Proper error handling
- ✅ Fallbacks for optional services
- ✅ Database auto-setup
- ✅ CORS configuration
- ✅ Health check endpoint

Just make sure to:
1. Set environment variables in Render dashboard
2. Link database service (or use render.yaml)
3. Deploy!
