#!/bin/bash
# ─────────────────────────────────────────────
# Vaani — one-click GitHub push
# Usage: bash push_to_github.sh
# ─────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Vaani → GitHub Push Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check git is installed
if ! command -v git &> /dev/null; then
    echo "❌  Git not found. Install from: https://git-scm.com"
    exit 1
fi

# Ask for GitHub repo URL
echo "Step 1: Go to github.com → New repository → name it 'vaani' → Create"
echo ""
read -p "Paste your GitHub repo URL here (e.g. https://github.com/yourname/vaani.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌  No URL entered. Exiting."
    exit 1
fi

echo ""
echo "⏳  Setting up git..."

# Init if not already
if [ ! -d ".git" ]; then
    git init
    echo "✅  Git initialized"
fi

# Set remote
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
echo "✅  Remote set to $REPO_URL"

# Stage everything
git add .
echo "✅  All files staged"

# Commit
git commit -m "Initial commit — Vaani v1.0 🇮🇳" 2>/dev/null || echo "   (nothing new to commit)"

# Push
git branch -M main
echo ""
echo "⏳  Pushing to GitHub..."
echo "   (GitHub will ask for username + token — use Personal Access Token as password)"
echo "   Get token: github.com → Settings → Developer Settings → Personal Access Tokens → Generate"
echo ""
git push -u origin main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Done! Your code is on GitHub."
echo "    Open: ${REPO_URL%.git}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
