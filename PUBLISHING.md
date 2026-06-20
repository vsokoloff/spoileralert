# Publishing Spoiler Alert (under your own accounts)

This guide takes you from the current code to a live web app on **your** Render
account and **your** Gemini key — no teammate credentials involved. Mobile prep
is at the bottom.

You need three free things:

1. A **GitHub** account (you have one).
2. A **Google Gemini** API key — https://aistudio.google.com/app/apikey (free, no billing).
3. A **Render** account — https://render.com (sign in with GitHub).

---

## Step 1 — Put the code in your own GitHub repo

The old remote pointed at a teammate's repo (`vsokoloff/spoileralert`). I renamed
it to `teammate-original` so you can't push there by accident. Create your own
empty repo on GitHub (e.g. `spoileralert`), then from the project folder:

```bash
git add .
git commit -m "Prep for independent deploy: bug fixes + own credentials"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/spoileralert.git
git push -u origin main
```

Your `.env` and any credentials are gitignored, so no secrets get uploaded.
(I verified nothing sensitive is tracked in git history.)

---

## Step 2 — Deploy to Render (one Blueprint = frontend + backend + database)

1. Go to https://dashboard.render.com → **New** → **Blueprint**.
2. Connect your GitHub and pick your `spoileralert` repo.
3. Render reads `render.yaml` and proposes three services:
   - `spoileralert-backend` (FastAPI API)
   - `spoileralert-frontend` (the React site)
   - `spoileralert-db` (PostgreSQL)
4. It will ask for the values marked `sync: false`. For now you can leave the URL
   ones blank and just set:
   - **GEMINI_API_KEY** = your Gemini key (on the backend service)
5. Click **Apply**. First build takes a few minutes.

### Step 2b — Connect the two URLs (one-time)

After the first deploy, Render shows each service's public URL, e.g.
`https://spoileralert-backend.onrender.com` and
`https://spoileralert-frontend.onrender.com` (your exact names may have a suffix
if the name was taken). Now wire them together:

- On **spoileralert-backend** → Environment → set
  `FRONTEND_URL` = your frontend URL (no trailing slash). This enables CORS.
- On **spoileralert-frontend** → Environment → set
  `VITE_API_URL` = your backend URL. Then **Clear build cache & deploy** the
  frontend (this value is baked in at build time).

That's it — open your frontend URL, register an account, and you're live.

> Note: Render's free tier sleeps after inactivity, so the first request after a
> while takes ~30–50s to wake the backend. Fine for an MVP/demo.

---

## Step 3 — Local development (optional)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# put your own Gemini key in backend/.env (GEMINI_API_KEY=...)
uvicorn app.main:app --reload      # http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                        # http://localhost:3000
```

The frontend proxies `/api` to `localhost:8000` automatically in dev, so you
don't need to set `VITE_API_URL` locally. Local data uses a SQLite file
(`backend/spoiler_alert.db`) created on first run.

---

## Step 4 — Mobile app (when you're ready)

The project already has Capacitor with `ios/` and `android/` folders. The mobile
app bundles the web build and talks to your live backend, so:

```bash
cd frontend
# Build with your backend URL baked in:
VITE_API_URL="https://spoileralert-backend.onrender.com" npm run build
npx cap sync                       # copies dist/ into ios & android
npx cap open ios                   # opens Xcode  (needs a Mac + Xcode)
npx cap open android               # opens Android Studio
```

The backend already allows the Capacitor mobile origins for CORS, so API calls
work from the app. From Xcode / Android Studio you can run it on a simulator or
submit to the App Store / Play Store. (A home-screen **widget** is a native
add-on built in Xcode/Android Studio on top of this — a separate later step.)

---

## What changed to make this possible

- **Bug:** the categories endpoint ignored login and always returned user #1's
  food to everyone. Now scoped to the logged-in user (privacy fix).
- **Bug:** the "smart shelf-life" AI fallback called OpenAI, which was never
  imported or installed, so it always silently failed. Switched to Gemini using
  your single `GEMINI_API_KEY`.
- **Bug:** backend tests were written before login existed and all failed. Rewritten
  to authenticate; all pass.
- **Bug:** `npm run lint` had no config and crashed. Added ESLint config; lint is clean.
- **Deploy fix:** `render.yaml` built from the wrong folder and didn't deploy the
  frontend. Now deploys frontend + backend + Postgres, with `rootDir` set.
- **Deploy fix:** Render's `postgres://` URLs are normalized to `postgresql://`.
- **Credentials:** removed the unused teammate Google service-account file, blanked
  the teammate Gemini key from `.env`, removed the hardcoded teammate backend URL
  from the frontend, and renamed the teammate git remote. Added `.env.example`
  templates so anyone can plug in their own keys.
