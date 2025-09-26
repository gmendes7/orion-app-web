#!/usr/bin/env bash
set -euo pipefail

# Script: remove-secrets.sh
# Purpose: Use git-filter-repo to redact specific secrets from git history and remove 'dist/' artifacts.
# IMPORTANT: Do NOT run until you have rotated the leaked secrets (OpenAI, Supabase). After rotation, run this on a local clone, then force-push.

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "Working dir: $REPO_DIR"

echo "1) Ensure working tree is clean..."
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: You have uncommitted changes. Commit or stash them before running this script." >&2
    git status --porcelain
    exit 1
fi

echo "2) Check for git-filter-repo..."
if ! command -v git-filter-repo >/dev/null 2>&1; then
    echo "git-filter-repo not found. Installing via pip (user)..."
    if command -v pip >/dev/null 2>&1; then
        pip install --user git-filter-repo
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo "Please install git-filter-repo manually: https://github.com/newren/git-filter-repo" >&2
        exit 1
    fi
fi

# Safety: make a backup branch in case anything goes wrong
BACKUP_BRANCH="backup-before-secret-clean-$(date +%Y%m%d%H%M%S)"
echo "3) Creating local backup branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# 4) Replace exact secret strings using replacements.txt
REPLACE_FILE="scripts/replacements.txt"
if [ -f "$REPLACE_FILE" ]; then
    echo "4) Running git-filter-repo --replace-text $REPLACE_FILE"
    git filter-repo --replace-text "$REPLACE_FILE" --force
else
    echo "No replacements file found at $REPLACE_FILE; skipping replacements step."
fi

# 5) Remove large/dist build artifacts from history (optional)
if [ -d "dist" ]; then
    echo "5) Removing 'dist/' from history to avoid leaking built bundles"
    git filter-repo --invert-paths --paths dist --force
fi

# 6) Expire reflog and run GC
echo "6) Cleaning up reflogs and running git gc"
git reflog expire --expire=now --all
git gc --prune=now --aggressive || true

# 7) Verify result locally: search for the old secrets
echo "7) Verifying that secrets are no longer present in the repository objects (text search)"
GREP_PATTERNS=(
    "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"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc"
)

FOUND=0
for p in "${GREP_PATTERNS[@]}"; do
    if git grep -n "$p" >/dev/null 2>&1; then
        echo "FOUND secret pattern: $p"
        FOUND=1
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "No occurrences found in working tree. Good."
else
    echo "WARNING: some secret patterns still found in the working tree or history. Inspect before pushing." >&2
fi

cat <<EOF

=== NEXT STEPS (manual) ===
1) Rotate the leaked keys in the providers (OpenAI, Supabase).
2) Update any environment variables in your deployment/CI with the new keys.
3) When ready, push the cleaned branch to remote with:
   git push --force-with-lease origin main

Note: Force-pushing rewrites history. Inform collaborators and have them reclone or follow the guidance from git-filter-repo docs.
EOF
