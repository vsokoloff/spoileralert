#!/bin/bash

# Git Repository Setup Script for Spoiler Alert MVP

echo "🚀 Setting up Git repository..."

# Navigate to project directory
cd "$(dirname "$0")"

# Initialize git repository
echo "📦 Initializing git repository..."
git init

# Add all files
echo "➕ Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Spoiler Alert MVP

- Food tracking app with expiration management
- Receipt scanning with Google Vision API
- SPOY AI assistant for recipe recommendations
- Mobile-first responsive design
- PostgreSQL/SQLite database support
- React frontend + FastAPI backend"

echo ""
echo "✅ Git repository initialized and committed!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Create a repository on GitHub:"
echo "   https://github.com/new"
echo ""
echo "2. Add the remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Or run: ./push_to_github.sh YOUR_GITHUB_REPO_URL"
