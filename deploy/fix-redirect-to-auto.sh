#!/bin/bash
# Fix: ALL domains redirect to auto-coverage.org
# Cause: auto-coverage.org.conf has default_server or catch-all redirect
# Run: sudo bash /var/www/TrackerApp/deploy/fix-redirect-to-auto.sh
set -e

echo "=== DIAGNOSE ==="
echo "--- auto-coverage.org.conf ---"
cat /etc/nginx/sites-enabled/auto-coverage.org.conf
echo "--- track.arthome.ai ---"
cat /etc/nginx/sites-available/track.arthome.ai 2>/dev/null || echo "(missing)"
echo "--- admin.arthome.ai ---"
cat /etc/nginx/sites-available/admin.arthome.ai 2>/dev/null || echo "(missing)"

# Backup auto-coverage (keep your real proxy_pass port)
cp /etc/nginx/sites-enabled/auto-coverage.org.conf \
  /root/auto-coverage.org.conf.bak.$(date +%s)

# Remove default_server from auto-coverage so it stops catching arthome
sed -i 's/ default_server//g' /etc/nginx/sites-enabled/auto-coverage.org.conf
sed -i 's/ default_server//g' /etc/nginx/sites-available/auto-coverage.org.conf 2>/dev/null || true

# --- arthome tracker ---
tee /etc/nginx/sites-available/track.arthome.ai > /dev/null <<'EOF'
server {
    listen 80;
    server_name track.arthome.ai;

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

# --- arthome admin ---
tee /etc/nginx/sites-available/admin.arthome.ai > /dev/null <<'EOF'
server {
    listen 80;
    server_name admin.arthome.ai;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# --- arthome root ---
tee /etc/nginx/sites-available/arthome.ai > /dev/null <<'EOF'
server {
    listen 80;
    server_name arthome.ai www.arthome.ai;
    return 301 https://admin.arthome.ai$request_uri;
}
EOF

ln -sf /etc/nginx/sites-available/track.arthome.ai /etc/nginx/sites-enabled/track.arthome.ai
ln -sf /etc/nginx/sites-available/admin.arthome.ai /etc/nginx/sites-enabled/admin.arthome.ai
ln -sf /etc/nginx/sites-available/arthome.ai /etc/nginx/sites-enabled/arthome.ai

rm -f /etc/nginx/sites-enabled/default.conf

nginx -t
systemctl reload nginx

echo ""
echo "=== TEST (must NOT say auto-coverage.org) ==="
curl -s http://track.arthome.ai/health
echo ""
curl -sI http://arthome.ai/ | grep -i location
curl -sI http://admin.arthome.ai/ | head -3

echo ""
echo "If track shows JSON ok:true → run:"
echo "  certbot --nginx -d track.arthome.ai -d admin.arthome.ai -d arthome.ai"
