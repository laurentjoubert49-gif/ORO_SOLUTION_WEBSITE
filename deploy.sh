#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# deploy.sh — Upload files to o2switch via FTP (curl)
# Usage:
#   ./deploy.sh                  → upload all tracked files
#   ./deploy.sh index.html       → upload specific file(s)
#   ./deploy.sh css/style.css js/main.js
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  .env.deploy introuvable — créez-le avec FTP_HOST / FTP_USER / FTP_PASS / FTP_REMOTE_PATH"
  exit 1
fi

# Load credentials
source "$ENV_FILE"

FTP_BASE="ftp://${FTP_HOST}/${FTP_REMOTE_PATH}"

# ── Files to deploy ──────────────────────────────────────────────
if [ $# -gt 0 ]; then
  FILES=("$@")
else
  # Default: all web files (not node_modules, scripts, dot-files)
  mapfile -t FILES < <(find "$SCRIPT_DIR" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/scripts/*" \
    -not -name "*.sh" \
    -not -name ".env*" \
    -not -name "package*.json" \
    -not -name "server.js" \
    -not -name "*.log" \
    -not -name ".gitignore" \
    -not -name ".DS_Store" \
    -type f \
    | sed "s|$SCRIPT_DIR/||")
fi

echo "🚀  Déploiement → ${FTP_BASE}"
echo "📦  ${#FILES[@]} fichier(s) à envoyer"
echo ""

OK=0
FAIL=0

for FILE in "${FILES[@]}"; do
  LOCAL="$SCRIPT_DIR/$FILE"
  if [ ! -f "$LOCAL" ]; then
    echo "  ⚠  Ignoré (introuvable) : $FILE"
    continue
  fi

  # Compute remote dir and ensure path separators are forward slashes
  REMOTE_DIR=$(dirname "$FILE" | tr '\\' '/')
  if [ "$REMOTE_DIR" = "." ]; then
    REMOTE_URL="${FTP_BASE}/"
  else
    REMOTE_URL="${FTP_BASE}/${REMOTE_DIR}/"
  fi

  # Upload with curl (FTP)
  RESULT=$(curl --silent --show-error \
    --ftp-create-dirs \
    --upload-file "$LOCAL" \
    "${REMOTE_URL}$(basename "$FILE")" \
    --user "${FTP_USER}:${FTP_PASS}" \
    2>&1)

  if [ $? -eq 0 ]; then
    echo "  ✅  $FILE"
    ((OK++))
  else
    echo "  ❌  $FILE  →  $RESULT"
    ((FAIL++))
  fi
done

echo ""
echo "─────────────────────────────────────────────"
echo "  ✅ Succès : $OK   ❌ Erreurs : $FAIL"
echo "─────────────────────────────────────────────"
[ $FAIL -eq 0 ] && exit 0 || exit 1
