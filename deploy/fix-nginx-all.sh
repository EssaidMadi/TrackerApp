#!/bin/bash
# Fix arthome.ai + track + admin nginx (run as root on VPS)
set -e

echo "=== Current sites-enabled ==="
ls -la /etc/nginx/sites-enabled/

echo "=== Installing arthome configs ==="
cp /var/www/TrackerApp/deploy/nginx-arthome.ai.conf /etc/nginx/sites-available/arthome.ai
cp /var/www/TrackerApp/deploy/nginx-track.arthome.ai.conf /etc/nginx/sites-available/track.arthome.ai
cp /var/www/TrackerApp/deploy/nginx-admin.arthome.ai.conf /etc/nginx/sites-available/admin.arthome.ai

ln -sf /etc/nginx/sites-available/arthome.ai /etc/nginx/sites-enabled/arthome.ai
ln -sf /etc/nginx/sites-available/track.arthome.ai /etc/nginx/sites-enabled/track.arthome.ai
ln -sf /etc/nginx/sites-available/admin.arthome.ai /etc/nginx/sites-enabled/admin.arthome.ai

# Remove broken default.conf if present
rm -f /etc/nginx/sites-enabled/default.conf

# Ensure auto-coverage ONLY handles its own domain (not default catch-all)
if [ -f /etc/nginx/sites-enabled/auto-coverage.org.conf ]; then
  if grep -q "default_server" /etc/nginx/sites-enabled/auto-coverage.org.conf; then
    echo "Removing default_server from auto-coverage.org.conf"
    sed -i 's/ default_server//g' /etc/nginx/sites-enabled/auto-coverage.org.conf
  fi
fi

nginx -t
systemctl reload nginx

echo ""
echo "=== Test HTTP (port 80) ==="
curl -sI -H "Host: track.arthome.ai" http://127.0.0.1/health | head -3
curl -sI -H "Host: admin.arthome.ai" http://127.0.0.1/ | head -3
curl -sI -H "Host: arthome.ai" http://127.0.0.1/ | head -3

echo ""
echo "=== Now run certbot (will find server_name blocks) ==="
echo "sudo certbot --nginx -d track.arthome.ai -d admin.arthome.ai -d arthome.ai"
