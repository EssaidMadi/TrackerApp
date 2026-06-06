#!/bin/bash
# Run on srv1313361 as root to fix track + admin SSL/routing
set -e

echo "=== 1. Check local apps ==="
curl -sf http://127.0.0.1:3001/health && echo " tracker-api OK" || echo " tracker-api FAILED"
curl -sfI http://127.0.0.1:3000 | head -1 || echo " tracker-admin FAILED"

echo "=== 2. Check certs ==="
ls /etc/letsencrypt/live/ 2>/dev/null || echo "No letsencrypt certs yet"

echo "=== 3. Write track.arthome.ai nginx config ==="
cat > /etc/nginx/sites-available/track.arthome.ai <<'EOF'
server {
    listen 80;
    server_name track.arthome.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name track.arthome.ai;

    ssl_certificate /etc/letsencrypt/live/track.arthome.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/track.arthome.ai/privkey.pem;

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

echo "=== 4. Write admin.arthome.ai nginx config ==="
cat > /etc/nginx/sites-available/admin.arthome.ai <<'EOF'
server {
    listen 80;
    server_name admin.arthome.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.arthome.ai;

    ssl_certificate /etc/letsencrypt/live/track.arthome.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/track.arthome.ai/privkey.pem;

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

ln -sf /etc/nginx/sites-available/track.arthome.ai /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.arthome.ai /etc/nginx/sites-enabled/

echo "=== 5. Test nginx ==="
nginx -t

echo "=== 6. Reload nginx ==="
systemctl reload nginx

echo "=== DONE ==="
echo "Test: curl https://track.arthome.ai/health"
echo "Test: curl -I https://admin.arthome.ai"
