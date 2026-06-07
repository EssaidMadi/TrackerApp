#!/bin/bash
# Clean admin rebuild — prevents ChunkLoadError after deploy.
# Run on server: bash /var/www/TrackerApp/deploy/rebuild-admin.sh
set -e

APP_DIR="${APP_DIR:-/var/www/TrackerApp}"

echo "Stopping tracker-admin..."
pm2 stop tracker-admin 2>/dev/null || true

echo "Building admin (clean)..."
cd "$APP_DIR/admin"
rm -rf .next
npm ci
npm run build

echo "Starting tracker-admin..."
cd "$APP_DIR"
pm2 restart tracker-admin --update-env

echo "Done. Hard-refresh the browser (Cmd+Shift+R) if a tab was already open."
