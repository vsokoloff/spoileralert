#!/bin/bash

# Push to GitHub Script

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub repository URL"
    echo ""
    echo "Usage: ./push_to_github.sh https://github.com/username/repo.git"
    exit 1
fi

REPO_URL=$1

echo "🚀 Pushing to GitHub..."
echo "Repository: $REPO_URL"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository first..."
    ./setup_git.sh
fi

# Add remote (remove if exists)
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

# Set branch to main
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 View your repo at: $REPO_URL"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "   1. The repository URL is correct"
    echo "   2. You have push access to the repository"
    echo "   3. You're authenticated with GitHub (git config --global user.name/email)"
fi
