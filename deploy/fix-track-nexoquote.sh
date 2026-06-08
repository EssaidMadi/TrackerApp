#!/bin/bash
# Fix broken track.nexoquote.com nginx symlink + install SSL
# Run on server: sudo bash /var/www/TrackerApp/deploy/fix-track-nexoquote.sh

set -euo pipefail

HOST="track.nexoquote.com"
APP="/var/www/TrackerApp"
CONF="/etc/nginx/sites-available/${HOST}.conf"
ENABLED="/etc/nginx/sites-enabled/${HOST}.conf"
CERT="/etc/letsencrypt/live/${HOST}/fullchain.pem"

echo "=== 1. Remove broken symlink (fixes nginx emerg) ==="
rm -f "$ENABLED"

echo "=== 2. HTTP-only config (works before cert exists) ==="
cat > "$CONF" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name track.nexoquote.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf "$CONF" "$ENABLED"
nginx -t
systemctl reload nginx
echo "  OK  nginx reloaded (HTTP)"

if [ ! -f "$CERT" ]; then
  echo "=== 3. Request SSL certificate ==="
  certbot certonly --nginx -d "$HOST" --non-interactive --agree-tos -m essaidmadi@gmail.com
else
  echo "=== 3. Certificate already exists ==="
fi

echo "=== 4. Install full HTTPS config ==="
cp "$APP/deploy/nginx-track.nexoquote.com.conf" "$CONF"
nginx -t
systemctl reload nginx

echo "=== 5. Test redirect ==="
curl -sI "https://${HOST}/lp1?utm_source=mediago" | head -8
echo "Done."
