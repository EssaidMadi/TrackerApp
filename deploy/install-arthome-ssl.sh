#!/bin/bash
# Install arthome nginx vhosts with existing Let's Encrypt cert
# Run: sudo bash /var/www/TrackerApp/deploy/install-arthome-ssl.sh
set -e

DEPLOY=/var/www/TrackerApp/deploy
CERT=/etc/letsencrypt/live/track.arthome.ai/fullchain.pem

if [ ! -f "$CERT" ]; then
  echo "ERROR: cert not found at $CERT"
  echo "Run: certbot certonly --webroot -w /var/www/html -d track.arthome.ai -d admin.arthome.ai -d arthome.ai"
  exit 1
fi

echo "=== Installing arthome nginx configs ==="
cp "$DEPLOY/nginx-track.arthome.ai.conf" /etc/nginx/sites-available/track.arthome.ai
cp "$DEPLOY/nginx-admin.arthome.ai.conf" /etc/nginx/sites-available/admin.arthome.ai
cp "$DEPLOY/nginx-arthome.ai.conf" /etc/nginx/sites-available/arthome.ai

ln -sf /etc/nginx/sites-available/track.arthome.ai /etc/nginx/sites-enabled/track.arthome.ai.conf
ln -sf /etc/nginx/sites-available/admin.arthome.ai /etc/nginx/sites-enabled/admin.arthome.ai.conf
ln -sf /etc/nginx/sites-available/arthome.ai /etc/nginx/sites-enabled/arthome.ai.conf
rm -f /etc/nginx/sites-enabled/track.arthome.ai /etc/nginx/sites-enabled/admin.arthome.ai /etc/nginx/sites-enabled/arthome.ai

rm -f /etc/nginx/sites-enabled/default.conf

echo "=== Verify server_name blocks are enabled ==="
grep -r "server_name" /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx

echo ""
echo "=== Tests ==="
curl -s https://track.arthome.ai/health
echo ""
curl -sI https://admin.arthome.ai/ | head -4
curl -sI https://arthome.ai/ | grep -i location

echo ""
echo "Done. Cert already valid — no certbot needed."
