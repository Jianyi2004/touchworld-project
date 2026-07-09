#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-$(git branch --show-current)}"
COMMIT_MSG="${1:-Update TouchWorld website}"
RUN_BUILD="${RUN_BUILD:-1}"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-/tmp/npm-cache-codex}"

NODE24=(npx --cache "$NPM_CACHE_DIR" -p node@24 node)
NPM24=(npx --cache "$NPM_CACHE_DIR" -p node@24 -p npm@11 npm)

if [[ -z "$BRANCH" ]]; then
  echo "Could not detect the current git branch."
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "package.json not found. Please run this script from the website repository."
  exit 1
fi

echo "Repository: $ROOT_DIR"
echo "Remote:     $REMOTE"
echo "Branch:     $BRANCH"

if [[ "$RUN_BUILD" == "1" ]]; then
  if [[ ! -x node_modules/.bin/next ]]; then
    echo "Next.js dependencies not found. Installing with npm ci..."
    "${NPM24[@]}" ci --include=optional --cache "$NPM_CACHE_DIR"
  fi

  echo "Running typecheck..."
  "${NPM24[@]}" run typecheck

  echo "Building static website export..."
  "${NODE24[@]}" node_modules/next/dist/bin/next build
fi

echo "Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "No new local changes to commit."
else
  echo "Committing changes: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

echo "Pushing to $REMOTE/$BRANCH..."
git push -u "$REMOTE" "$BRANCH"

echo "Done. GitHub Pages will update after the deploy workflow finishes:"
echo "https://github.com/Jianyi2004/touchworld-project/actions"
echo "Website:"
echo "https://jianyi2004.github.io/touchworld-project/"
