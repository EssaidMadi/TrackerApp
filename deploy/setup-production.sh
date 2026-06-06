#!/bin/bash
# ONE script to fix production on srv1313361
# Run: sudo bash /var/www/TrackerApp/deploy/setup-production.sh
set -e

APP_DIR="/var/www/TrackerApp"
CERT_DIR="/etc/letsencrypt/live/track.arthome.ai"

echo "============================================"
echo " TRACKER PRODUCTION SETUP"
echo "============================================"

# --- 1. PM2 apps ---
echo ""
echo "[1/6] Checking PM2 apps..."
if ! pm2 status | grep -q "online"; then
  echo "Starting PM2..."
  cd "$APP_DIR" && pm2 start deploy/ecosystem.config.cjs
fi
curl -sf http://127.0.0.1:3001/health > /dev/null && echo "  OK  tracker-api :3001" || { echo "  FAIL tracker-api - run: cd $APP_DIR/backend && npm run build"; exit 1; }
curl -sfI http://127.0.0.1:3000 > /dev/null && echo "  OK  tracker-admin :3000" || { echo "  FAIL tracker-admin"; exit 1; }

# --- 2. admin .env.local ---
echo ""
echo "[2/6] Checking admin/.env.local..."
ENV_FILE="$APP_DIR/admin/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'ENVEOF'
GOOGLE_CLIENT_ID=PASTE_YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=PASTE_YOUR_GOOGLE_CLIENT_SECRET
AUTH_SECRET=PASTE_RUN_openssl_rand_base64_32
ALLOWED_ADMIN_EMAILS=essaidmadi@gmail.com
TRACKER_API_URL=http://127.0.0.1:3001
TRACKER_API_KEY=dev-api-key-change-me
ENVEOF
  echo "  CREATED $ENV_FILE"
  echo "  >>> EDIT THIS FILE NOW with real Google OAuth values <<<"
  echo "  nano $ENV_FILE"
  echo "  Then re-run this script."
  exit 1
fi
if grep -q "PASTE_YOUR" "$ENV_FILE"; then
  echo "  FAIL .env.local still has placeholder values"
  echo "  Edit: nano $ENV_FILE"
  exit 1
fi
echo "  OK  .env.local exists"
pm2 restart tracker-admin --update-env 2>/dev/null || true

# --- 3. SSL certificate ---
echo ""
echo "[3/6] Checking SSL certificate..."
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "  Getting certificate from Let's Encrypt..."
  systemctl stop nginx 2>/dev/null || true
  certbot certonly --standalone -d track.arthome.ai -d admin.arthome.ai --non-interactive --agree-tos -m essaidmadi@gmail.com || {
    echo "  certbot failed - check DNS points to this server"
    systemctl start nginx 2>/dev/null || true
    exit 1
  }
  systemctl start nginx 2>/dev/null || true
fi
echo "  OK  certificate at $CERT_DIR"

# --- 4. nginx configs ---
echo ""
echo "[4/6] Writing nginx configs..."

cat > /etc/nginx/sites-available/track.arthome.ai <<EOF
server {
    listen 80;
    server_name track.arthome.ai;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name track.arthome.ai;
    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

cat > /etc/nginx/sites-available/admin.arthome.ai <<EOF
server {
    listen 80;
    server_name admin.arthome.ai;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name admin.arthome.ai;
    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/track.arthome.ai /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.arthome.ai /etc/nginx/sites-enabled/

# Remove certbot junk from default.conf if it breaks things
if [ -f /etc/nginx/sites-enabled/default.conf ]; then
  if grep -q "quic" /etc/nginx/sites-enabled/default.conf 2>/dev/null; then
    sed -i 's/listen.*quic.*;//g' /etc/nginx/sites-enabled/default.conf
  fi
fi

# Stop arthome.ai root from hijacking admin app
ARTHOME_CONF="/etc/nginx/sites-enabled/arthome.ai.conf"
if [ -f "$ARTHOME_CONF" ] && grep -q "127.0.0.1:3000" "$ARTHOME_CONF"; then
  echo "  FIX arthome.ai.conf was pointing to admin app - removing proxy to :3000"
  sed -i 's|proxy_pass http://127.0.0.1:3000|# proxy_pass http://127.0.0.1:3000|g' "$ARTHOME_CONF"
fi

nginx -t
systemctl reload nginx
echo "  OK  nginx reloaded"

# --- 5. Google OAuth reminder ---
echo ""
echo "[5/6] Google OAuth redirect URI (do in browser):"
echo "  https://console.cloud.google.com/apis/credentials"
echo "  Add: https://admin.arthome.ai/api/auth/callback/google"

# --- 6. Final tests ---
echo ""
echo "[6/6] Testing..."
sleep 2
TRACK=$(curl -sk https://track.arthome.ai/health 2>/dev/null || echo "FAIL")
ADMIN=$(curl -skI https://admin.arthome.ai/ 2>/dev/null | head -1 || echo "FAIL")

echo ""
echo "============================================"
echo " RESULTS"
echo "============================================"
echo " track.arthome.ai/health  => $TRACK"
echo " admin.arthome.ai         => $ADMIN"
echo ""
if echo "$TRACK" | grep -q '"ok"'; then
  echo " SUCCESS - tracker is live!"
else
  echo " STILL FAILING - paste this full output in chat"
fi
echo "============================================"
