# 📦 Git Repository Setup Instructions

## Quick Setup (Recommended)

### Step 1: Run the Setup Script

Open your terminal and run:

```bash
cd "/Users/vica/Spoiler Alert "
./setup_git.sh
```

This will:
- ✅ Initialize git repository
- ✅ Add all files
- ✅ Create initial commit

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `spoiler-alert` (or your choice)
3. Description: "Food tracking app with expiration management and AI recipe recommendations"
4. Choose Public or Private
5. **DO NOT** check "Initialize with README" (we already have files)
6. Click "Create repository"

### Step 3: Push to GitHub

**Option A: Use the push script (easiest)**
```bash
./push_to_github.sh https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Option B: Manual push**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Manual Setup (Alternative)

If you prefer to do it manually:

```bash
cd "/Users/vica/Spoiler Alert "

# Initialize git
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: Spoiler Alert MVP"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git branch -M main
git push -u origin main
```

## What Gets Committed

✅ **Included:**
- All source code (frontend & backend)
- Configuration files
- Documentation
- Database schemas
- API endpoints
- React components

❌ **Excluded (via .gitignore):**
- `.env` files (API keys)
- `node_modules/`
- `venv/`
- `*.db` files
- Google credentials
- Build artifacts

## Troubleshooting

### "Repository not found"
- Make sure the repository exists on GitHub
- Check the URL is correct
- Verify you have push access

### "Authentication failed"
- Set up GitHub authentication:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- Or use GitHub CLI: `gh auth login`

### "Permission denied"
- Make sure you have write access to the repository
- Check if you're using HTTPS (may need personal access token) or SSH

## Next Steps After Pushing

1. ✅ Your code is now on GitHub!
2. Set up deployment (Vercel for frontend, Railway/Render for backend)
3. Add collaborators if working in a team
4. Set up CI/CD if needed

## Repository Structure

```
spoiler-alert/
├── backend/          # Python FastAPI backend
├── frontend/         # React frontend
├── data/             # Food storage guidelines
├── README.md         # Main documentation
└── ...               # Other files
```
